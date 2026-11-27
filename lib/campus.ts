import { and, eq, gte, inArray, isNull, lt, lte, sql, desc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { SessionStatus } from "@/db/schema";
import { publish } from "./bus";
import { notifyUsers, rosterOf, fmt } from "./notify";
import { proposeSlots } from "./slot-engine";
import { atLocal, localParts, startOfLocalDay, fmtRange, fmtDay } from "./time";
import { teaches, teacherIds } from "./teach";

/* ======================= Attendance ======================= */

type AStatus = (typeof s.attendanceStatusEnum.enumValues)[number];
const LIVE: SessionStatus[] = ["scheduled", "pending", "confirmed", "delayed"];

export async function setAttendance(sessionId: string, userId: string, status: AStatus, source: string, overwrite = true) {
  const q = db.insert(s.attendance).values({ sessionId, userId, status, source });
  await (overwrite ? q.onConflictDoUpdate({ target: [s.attendance.sessionId, s.attendance.userId], set: { status, source, updatedAt: new Date() } }) : q.onConflictDoNothing());
}

/** Student taps "I'm here" between 15 min before start and the end of class. */
export async function checkIn(sessionId: string, userId: string, now = new Date()) {
  const [row] = await db.select({ ses: s.sessions }).from(s.sessions)
    .innerJoin(s.enrollments, and(eq(s.enrollments.classId, s.sessions.classId), eq(s.enrollments.userId, userId)))
    .where(eq(s.sessions.id, sessionId)).limit(1);
  if (!row) return { ok: false as const, error: "You are not enrolled in this class." };
  const { ses } = row;
  if (!LIVE.includes(ses.status)) return { ok: false as const, error: "Check-in is closed for this class." };
  const opens = +ses.startsAt - 15 * 60_000, closes = +ses.endsAt + (ses.delayMinutes ?? 0) * 60_000;
  if (+now < opens || +now > closes) return { ok: false as const, error: "Check-in opens 15 minutes before class and closes when it ends." };
  await setAttendance(sessionId, userId, "present", "check-in");
  publish({ type: "room", message: "check-in", tone: "info", classId: ses.classId });
  return { ok: true as const };
}

/** Meeting number of a session = its position among the class's sessions so far. */
export async function meetingNumbers(sessionIds: string[]) {
  if (!sessionIds.length) return new Map<string, number>();
  const rows = await db.execute<{ id: string; n: number }>(sql`
    select s.id, (select count(*)::int from ${s.sessions} p where p.class_id = s.class_id and p.starts_at <= s.starts_at and p.status <> 'rescheduled') as n
    from ${s.sessions} s where s.id in ${sessionIds}`);
  return new Map(rows.map((r) => [r.id, Number(r.n)]));
}

export async function attendanceList(sessionId: string) {
  const [ses] = await db.select().from(s.sessions).where(eq(s.sessions.id, sessionId)).limit(1);
  if (!ses) return null;
  const rows = await db.select({ id: s.users.id, name: s.users.name, studentNo: s.users.studentNo, status: s.attendance.status, source: s.attendance.source })
    .from(s.enrollments).innerJoin(s.users, eq(s.users.id, s.enrollments.userId))
    .leftJoin(s.attendance, and(eq(s.attendance.userId, s.enrollments.userId), eq(s.attendance.sessionId, sessionId)))
    .where(eq(s.enrollments.classId, ses.classId)).orderBy(s.users.name);
  const meeting = (await meetingNumbers([sessionId])).get(sessionId) ?? 1;
  return { session: ses, meeting, rows };
}

/* ======================= Permitly ======================= */

export const PROOF_WINDOW_H = 72; // the letter may come later, but within 3 days
const PROOF_REMIND_EVERY_H = 12;

export async function attachProof(permissionId: string, userId: string, path: string, name: string) {
  const [p] = await db.update(s.permissions).set({ proofPath: path, proofName: name, proofAt: new Date() })
    .where(and(eq(s.permissions.id, permissionId), eq(s.permissions.userId, userId), inArray(s.permissions.status, ["pending", "approved"]))).returning();
  if (!p) return { ok: false as const, error: "This request can no longer take a letter." };
  const [k] = await db.select({ id: s.classes.id, name: s.classes.name }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId)).where(eq(s.sessions.id, p.sessionId));
  await notifyUsers(await teacherIds(k.id), "proof", (t) => ({ title: t.notif.proof.title, body: fmt(t.notif.proof.body, { course: k.name }), url: "/lecturer" }));
  publish({ type: "permission", message: "proof", tone: "info" });
  return { ok: true as const };
}

/* ======================= Change requests ======================= */

export async function requestChange(sessionId: string, lecturerId: string, reason: string) {
  const [ses] = await db.select({ ses: s.sessions, k: s.classes }).from(s.sessions).innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(eq(s.sessions.id, sessionId), teaches(lecturerId))).limit(1);
  if (!ses) return { ok: false as const, error: "Not your class" };
  if (!LIVE.includes(ses.ses.status)) return { ok: false as const, error: "This class already has an answer." };
  const open = await db.select({ id: s.changeRequests.id }).from(s.changeRequests).where(and(eq(s.changeRequests.sessionId, sessionId), eq(s.changeRequests.status, "pending")));
  if (open.length) return { ok: false as const, error: "A change request is already waiting for the komti." };
  const proposals = (await proposeSlots(sessionId)).filter((p) => p.kind !== "async");
  await db.insert(s.changeRequests).values({ sessionId, requestedBy: lecturerId, reason, proposals });
  if (ses.k.komtiId) await notifyUsers([ses.k.komtiId], "change", (t) => ({ title: t.notif.change.title, body: fmt(t.notif.change.body, { course: ses.k.name, when: `${fmtDay(ses.ses.startsAt, t.locale)} ${fmtRange(ses.ses.startsAt, ses.ses.endsAt)}` }), url: "/komti" }));
  publish({ type: "session", kind: "change", vars: { course: ses.k.name }, tone: "info", message: "Change request", classId: ses.k.id });
  return { ok: true as const };
}

export async function decideChange(requestId: string, komtiId: string, decision: "confirm" | "reject", slotId?: string) {
  const [row] = await db.select({ r: s.changeRequests, ses: s.sessions, k: s.classes }).from(s.changeRequests)
    .innerJoin(s.sessions, eq(s.sessions.id, s.changeRequests.sessionId)).innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(eq(s.changeRequests.id, requestId), eq(s.classes.komtiId, komtiId))).limit(1);
  if (!row || row.r.status !== "pending") return { ok: false as const, error: "Already decided." };
  if (decision === "reject") {
    await db.update(s.changeRequests).set({ status: "rejected", decidedBy: komtiId, decidedAt: new Date() }).where(eq(s.changeRequests.id, requestId));
    await notifyUsers([row.r.requestedBy], "change_no", (t) => ({ title: t.notif.changeNo.title, body: fmt(t.notif.changeNo.body, { course: row.k.name }), url: "/lecturer" }));
    publish({ type: "session", message: "change rejected", tone: "info", classId: row.k.id });
    return { ok: true as const };
  }
  const slot = row.r.proposals.find((p) => p.id === slotId);
  if (!slot?.startsAt) return { ok: false as const, error: "That slot is no longer offered." };
  const [moved] = await db.update(s.sessions).set({ status: "rescheduled", lockedSlot: slot, tokenHash: null, version: sql`${s.sessions.version} + 1`, updatedAt: new Date() })
    .where(and(eq(s.sessions.id, row.ses.id), inArray(s.sessions.status, LIVE))).returning();
  if (!moved) return { ok: false as const, error: "Someone else just changed this class. Refresh and try again." };
  await db.update(s.changeRequests).set({ status: "confirmed", chosen: slot, decidedBy: komtiId, decidedAt: new Date() }).where(eq(s.changeRequests.id, requestId));
  // The new slot becomes a real session so it gets its own reminders, check-in and attendance.
  await db.insert(s.sessions).values({ classId: row.k.id, roomId: slot.roomId!, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt!) }).onConflictDoNothing();
  const when = (loc: string) => `${fmtDay(slot.startsAt!, loc)} ${fmtRange(slot.startsAt!, slot.endsAt!)}`;
  await notifyUsers([...(await rosterOf(row.k.id)), row.r.requestedBy], "moved", (t) => ({ title: t.notif.moved.title, body: fmt(t.notif.moved.body, { course: row.k.name, when: when(t.locale), room: slot.roomCode ?? "" }), url: "/student" }));
  publish({ type: "session", kind: "moved", vars: { course: row.k.name }, tone: "ok", message: "Change confirmed", classId: row.k.id });
  return { ok: true as const };
}

/* ======================= The extra clock work (runs inside tick) ======================= */

const localDate = (d: Date) => { const p = localParts(d); return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; };
export async function isHoliday(d: Date) {
  return (await db.select({ d: s.holidays.date }).from(s.holidays).where(eq(s.holidays.date, localDate(d))).limit(1)).length > 0;
}

/** SiPenDosa, built in: a polite H-1 evening and H-0 morning reminder to the lecturer, skipped on holidays. */
async function lecturerReminders(now: Date) {
  const p = localParts(now);
  const tomorrow = new Date(+startOfLocalDay(now) + 86_400_000);
  const dayAfter = new Date(+tomorrow + 86_400_000);
  const rows = await db.select({ ses: s.sessions, k: s.classes, room: s.rooms.code }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId)).innerJoin(s.rooms, eq(s.rooms.id, s.sessions.roomId))
    .where(and(gte(s.sessions.startsAt, startOfLocalDay(now)), lt(s.sessions.startsAt, dayAfter), inArray(s.sessions.status, ["scheduled"])));
  for (const r of rows) {
    const isTomorrow = +r.ses.startsAt >= +tomorrow;
    const h1 = isTomorrow && p.minutes >= 19 * 60 && !r.ses.remindedH1At;
    const h0 = !isTomorrow && p.minutes >= 6 * 60 && !r.ses.remindedH0At && +r.ses.startsAt > +now;
    if (!h1 && !h0) continue;
    if (await isHoliday(r.ses.startsAt)) continue;
    await db.update(s.sessions).set(h1 ? { remindedH1At: now } : { remindedH0At: now }).where(eq(s.sessions.id, r.ses.id));
    const key = h1 ? "remindH1" : "remindH0";
    await notifyUsers(await teacherIds(r.k.id), key, (t) => ({
      title: t.notif[key].title,
      body: fmt(t.notif[key].body, { course: r.k.name, time: fmtRange(r.ses.startsAt, r.ses.endsAt), room: r.room }),
      url: "/lecturer",
    }));
  }
}

/** Komti must post a class photo while class runs; remind every 15 minutes until it is there. */
async function photoReminders(now: Date) {
  const rows = await db.select({ ses: s.sessions, k: s.classes }).from(s.sessions).innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(inArray(s.sessions.status, ["confirmed", "delayed"]), isNull(s.sessions.photoPath),
      lte(s.sessions.startsAt, new Date(+now - 10 * 60_000)), gte(s.sessions.endsAt, now)));
  for (const r of rows) {
    if (!r.k.komtiId || (r.ses.photoRemindedAt && +now - +r.ses.photoRemindedAt < 15 * 60_000)) continue;
    await db.update(s.sessions).set({ photoRemindedAt: now }).where(eq(s.sessions.id, r.ses.id));
    await notifyUsers([r.k.komtiId], "photo", (t) => ({ title: t.notif.photo.title, body: fmt(t.notif.photo.body, { course: r.k.name }), url: "/komti" }));
  }
}

/** Permitly: remind until the letter is in; at the deadline a request without a letter becomes Alpa. */
async function proofDeadlines(now: Date) {
  const open = await db.select({ p: s.permissions, k: s.classes }).from(s.permissions)
    .innerJoin(s.sessions, eq(s.sessions.id, s.permissions.sessionId)).innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(isNull(s.permissions.proofPath), inArray(s.permissions.status, ["pending", "approved"])));
  for (const { p, k } of open) {
    const due = p.proofDueAt ?? new Date(+p.createdAt + PROOF_WINDOW_H * 3_600_000);
    if (+now >= +due) {
      await db.update(s.permissions).set({ status: "expired" }).where(eq(s.permissions.id, p.id));
      await setAttendance(p.sessionId, p.userId, "absent", "permitly:no-letter");
      await notifyUsers([p.userId], "proofExpired", (t) => ({ title: t.notif.proofExpired.title, body: fmt(t.notif.proofExpired.body, { course: k.name }), url: "/student" }));
      publish({ type: "permission", message: "expired", tone: "warn" });
    } else if (!p.proofRemindedAt || +now - +p.proofRemindedAt >= PROOF_REMIND_EVERY_H * 3_600_000) {
      await db.update(s.permissions).set({ proofRemindedAt: now, proofDueAt: due }).where(eq(s.permissions.id, p.id));
      await notifyUsers([p.userId], "proofDue", (t) => ({ title: t.notif.proofDue.title, body: fmt(t.notif.proofDue.body, { course: k.name, when: `${fmtDay(due, t.locale)} ${fmtRange(due, due).split("–")[0]}` }), url: "/student" }));
    }
  }
}

/** After a class ends, anyone with no record is marked Alpa (Micro-Pause gets until the end of the day). */
async function finalizeAttendance(now: Date) {
  const since = new Date(+now - 2 * 86_400_000);
  const ended = await db.select({ id: s.sessions.id, classId: s.sessions.classId, status: s.sessions.status, endsAt: s.sessions.endsAt }).from(s.sessions)
    .where(and(gte(s.sessions.endsAt, since), lt(s.sessions.endsAt, new Date(+now - 30 * 60_000)), inArray(s.sessions.status, ["confirmed", "delayed", "micropause", "pending"])));
  for (const e of ended) {
    if (e.status === "micropause" && +now < +startOfLocalDay(e.endsAt) + 86_400_000) continue;
    const roster = await rosterOf(e.classId);
    if (!roster.length) continue;
    await db.insert(s.attendance).values(roster.map((userId) => ({ sessionId: e.id, userId, status: "absent" as const, source: "auto:no-record" }))).onConflictDoNothing();
  }
}

export async function campusTick(now = new Date()) {
  await lecturerReminders(now);
  await photoReminders(now);
  await proofDeadlines(now);
  await finalizeAttendance(now);
}

export async function recentChangeRequests(classIds: string[]) {
  if (!classIds.length) return [];
  return db.select({ r: s.changeRequests, ses: s.sessions, name: s.users.name }).from(s.changeRequests)
    .innerJoin(s.sessions, eq(s.sessions.id, s.changeRequests.sessionId)).innerJoin(s.users, eq(s.users.id, s.changeRequests.requestedBy))
    .where(inArray(s.sessions.classId, classIds)).orderBy(desc(s.changeRequests.createdAt)).limit(10);
}

export { atLocal };
