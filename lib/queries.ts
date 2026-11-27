import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, desc, eq, gte, inArray, lt, sql, count } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { startOfLocalDay } from "./time";
import { quizFor } from "./quiz";
import { meetingNumbers, recentChangeRequests } from "./campus";

/* ---------- Catalog: slow-changing, cached across requests (tag "catalog") ---------- */

export const getCatalog = unstable_cache(async () => {
  const [classes, rooms, modules, roster] = await Promise.all([
    db.select({ id: s.classes.id, code: s.classes.code, name: s.classes.name, section: s.classes.section, lecturerId: s.classes.lecturerId, komtiId: s.classes.komtiId, lecturerName: s.users.name })
      .from(s.classes).innerJoin(s.users, eq(s.users.id, s.classes.lecturerId)),
    db.select().from(s.rooms),
    db.select().from(s.microModules),
    db.select({ classId: s.enrollments.classId, n: count() }).from(s.enrollments).groupBy(s.enrollments.classId),
  ]);
  return {
    classes: Object.fromEntries(classes.map((c) => [c.id, { ...c, enrolled: roster.find((r) => r.classId === c.id)?.n ?? 0 }])),
    rooms: Object.fromEntries(rooms.map((r) => [r.id, r])),
    modules: Object.fromEntries(modules.map((m) => [m.classId, m])),
  };
}, ["catalog-v1"], { tags: ["catalog"], revalidate: 3600 });

export const getPersonas = unstable_cache(async () =>
  db.select({ id: s.users.id, name: s.users.name, role: s.users.role, studentNo: s.users.studentNo }).from(s.users)
    .where(inArray(s.users.email, ["s001@campus.test", "s002@campus.test", "naufal@campus.test", "sari@campus.test"])),
["personas-v1"], { tags: ["catalog"], revalidate: 3600 });

/* ---------- Live state: never cached across requests; deduped per request ---------- */

const todayWindow = () => {
  const start = startOfLocalDay(new Date());
  return { start, end: new Date(+start + 86_400_000) };
};

export const getClassIdsFor = cache(async (userId: string) =>
  (await db.select({ id: s.enrollments.classId }).from(s.enrollments).where(eq(s.enrollments.userId, userId))).map((r) => r.id));

export async function getTodaySessions(classIds: string[]) {
  if (!classIds.length) return [];
  const { start, end } = todayWindow();
  return db.select().from(s.sessions)
    .where(and(inArray(s.sessions.classId, classIds), gte(s.sessions.startsAt, start), lt(s.sessions.startsAt, end)))
    .orderBy(s.sessions.startsAt);
}

export async function getStudentView(userId: string) {
  const classIds = await getClassIdsFor(userId);
  const [catalog, sessions] = await Promise.all([getCatalog(), getTodaySessions(classIds)]);
  const ids = sessions.map((x) => x.id);
  const [receipts, perms, totals] = await Promise.all([
    ids.length ? db.select().from(s.attendanceReceipts).where(and(eq(s.attendanceReceipts.userId, userId), inArray(s.attendanceReceipts.sessionId, ids))) : [],
    ids.length ? db.select().from(s.permissions).where(and(eq(s.permissions.userId, userId), inArray(s.permissions.sessionId, ids))) : [],
    db.select({ n: count() }).from(s.attendanceReceipts).where(eq(s.attendanceReceipts.userId, userId)),
  ]);
  const [att, meetings] = await Promise.all([
    ids.length ? db.select().from(s.attendance).where(and(eq(s.attendance.userId, userId), inArray(s.attendance.sessionId, ids))) : [],
    meetingNumbers(ids),
  ]);
  return {
    sessions: sessions.map((x) => ({
      ...x,
      klass: catalog.classes[x.classId],
      room: catalog.rooms[x.roomId],
      // Answers are stripped: the client only gets this student's own question paper.
      module: catalog.modules[x.classId] ? (({ quiz, ...m }) => ({ ...m, questions: quizFor(userId, x.id, quiz), bankSize: quiz.length }))(catalog.modules[x.classId]) : null,
      receipt: receipts.find((r) => r.sessionId === x.id) ?? null,
      permission: perms.find((p) => p.sessionId === x.id) ?? null,
      attendance: att.find((a) => a.sessionId === x.id)?.status ?? null,
      meeting: meetings.get(x.id) ?? 1,
    })),
    completedPauses: totals[0]?.n ?? 0,
  };
}

export async function getKomtiView(userId: string) {
  const catalog = await getCatalog();
  const classIds = Object.values(catalog.classes).filter((c) => c.komtiId === userId).map((c) => c.id);
  const sessions = await getTodaySessions(classIds);
  const ids = sessions.map((x) => x.id);
  const [perms, receiptCounts, feed] = await Promise.all([
    ids.length ? db.select({ p: s.permissions, name: s.users.name, studentNo: s.users.studentNo })
      .from(s.permissions).innerJoin(s.users, eq(s.users.id, s.permissions.userId))
      .where(inArray(s.permissions.sessionId, ids)).orderBy(desc(s.permissions.createdAt)) : [],
    ids.length ? db.select({ sessionId: s.attendanceReceipts.sessionId, n: count() }).from(s.attendanceReceipts)
      .where(inArray(s.attendanceReceipts.sessionId, ids)).groupBy(s.attendanceReceipts.sessionId) : [],
    ids.length ? db.select().from(s.events).where(inArray(s.events.sessionId, ids)).orderBy(desc(s.events.createdAt)).limit(12) : [],
  ]);
  const [meetings, changes, attCounts] = await Promise.all([
    meetingNumbers(ids), recentChangeRequests(classIds),
    ids.length ? db.select({ sessionId: s.attendance.sessionId, status: s.attendance.status, n: count() }).from(s.attendance)
      .where(inArray(s.attendance.sessionId, ids)).groupBy(s.attendance.sessionId, s.attendance.status) : [],
  ]);
  return {
    changes: changes.map((c) => ({ ...c.r, by: c.name, className: catalog.classes[c.ses.classId]?.name ?? "", startsAt: c.ses.startsAt, endsAt: c.ses.endsAt })),
    sessions: sessions.map((x) => ({
      ...x, klass: catalog.classes[x.classId], room: catalog.rooms[x.roomId],
      receipts: receiptCounts.find((r) => r.sessionId === x.id)?.n ?? 0,
      meeting: meetings.get(x.id) ?? 1,
      att: Object.fromEntries(attCounts.filter((a) => a.sessionId === x.id).map((a) => [a.status, a.n])) as Record<string, number>,
    })),
    permissions: perms.map((r) => ({ ...r.p, name: r.name, studentNo: r.studentNo, className: catalog.classes[sessions.find((x) => x.id === r.p.sessionId)!.classId]?.name })),
    feed,
  };
}

export async function getLecturerView(userId: string) {
  const catalog = await getCatalog();
  const classIds = Object.values(catalog.classes).filter((c) => c.lecturerId === userId).map((c) => c.id);
  const sessions = await getTodaySessions(classIds);
  const ids = sessions.map((x) => x.id);
  const perms = ids.length ? await db.select({ p: s.permissions, name: s.users.name })
    .from(s.permissions).innerJoin(s.users, eq(s.users.id, s.permissions.userId))
    .where(inArray(s.permissions.sessionId, ids)).orderBy(desc(s.permissions.createdAt)) : [];
  const [meetings, changes] = await Promise.all([meetingNumbers(ids), recentChangeRequests(classIds)]);
  return {
    changes: changes.map((c) => ({ ...c.r, className: catalog.classes[c.ses.classId]?.name ?? "" })),
    sessions: sessions.map((x) => ({ ...x, klass: catalog.classes[x.classId], room: catalog.rooms[x.roomId], meeting: meetings.get(x.id) ?? 1 })),
    permissions: perms.map((r) => ({ ...r.p, name: r.name, className: catalog.classes[sessions.find((x) => x.id === r.p.sessionId)!.classId]?.name })),
  };
}

export async function getSessionByTokenHash(tokenHash: string) {
  const catalog = await getCatalog();
  const [x] = await db.select().from(s.sessions).where(eq(s.sessions.tokenHash, tokenHash)).limit(1);
  return x ? { ...x, klass: catalog.classes[x.classId], room: catalog.rooms[x.roomId] } : null;
}

export async function getHealth() {
  const t = Date.now();
  await db.execute(sql`select 1`);
  return { db: "ok", latencyMs: Date.now() - t };
}

/* ---------- Inbox, profile, weekly schedule ---------- */

export async function getUnreadCount(userId: string) {
  const [r] = await db.select({ n: count() }).from(s.notifications)
    .where(and(eq(s.notifications.userId, userId), sql`${s.notifications.readAt} is null`));
  return r?.n ?? 0;
}

export async function getInbox(userId: string) {
  return db.select().from(s.notifications).where(eq(s.notifications.userId, userId)).orderBy(desc(s.notifications.createdAt)).limit(60);
}

export async function getProfile(userId: string) {
  const catalog = await getCatalog();
  const [classIds, receipts, perms] = await Promise.all([
    getClassIdsFor(userId),
    db.select({ r: s.attendanceReceipts, startsAt: s.sessions.startsAt, classId: s.sessions.classId })
      .from(s.attendanceReceipts).innerJoin(s.sessions, eq(s.sessions.id, s.attendanceReceipts.sessionId))
      .where(eq(s.attendanceReceipts.userId, userId)).orderBy(desc(s.attendanceReceipts.createdAt)).limit(20),
    db.select({ n: count() }).from(s.permissions).where(eq(s.permissions.userId, userId)),
  ]);
  const teaching = Object.values(catalog.classes).filter((c) => c.lecturerId === userId).length;
  return {
    classes: classIds.length || teaching,
    requests: perms[0]?.n ?? 0,
    receipts: receipts.map((x) => ({ ...x.r, startsAt: x.startsAt, className: catalog.classes[x.classId]?.name ?? "" })),
  };
}

export async function getWeekly(userId: string, role: "student" | "komti" | "lecturer") {
  const catalog = await getCatalog();
  const classIds = role === "lecturer"
    ? Object.values(catalog.classes).filter((c) => c.lecturerId === userId).map((c) => c.id)
    : await getClassIdsFor(userId);
  if (!classIds.length) return [];
  const rows = await db.select().from(s.meetings).where(inArray(s.meetings.classId, classIds));
  return rows.map((m) => ({ ...m, className: catalog.classes[m.classId]?.name ?? "", lecturerName: catalog.classes[m.classId]?.lecturerName ?? "", room: catalog.rooms[m.roomId]?.code ?? "" }));
}
