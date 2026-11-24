import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, lt, lte, isNull, sql, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { SessionStatus, SlotProposal } from "@/db/schema";
import { env } from "./env";
import { publish } from "./bus";
import { proposeSlots } from "./slot-engine";
import { sendLecturerPrompt } from "./notifier";
import { atLocal, localParts, startOfLocalDay, fmtRange, fmtDay } from "./time";

export const PROMPT_LEAD_MIN = 120; // H-2h
export const SLA_GRACE_MIN = 15;    // H+15m

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

async function logEvent(sessionId: string | null, type: string, message: string, actorId?: string | null) {
  await db.insert(s.events).values({ sessionId, type, message, actorId: actorId ?? null });
}


/** Materialise today's sessions from the weekly timetable (idempotent). */
export async function ensureSessionsFor(day: Date) {
  const p = localParts(day);
  const start = atLocal(p.y, p.m, p.d, 0);
  // A class that already has a session today (e.g. a demo restart) isn't materialised again.
  const existing = new Set((await db.select({ c: s.sessions.classId }).from(s.sessions)
    .where(and(gte(s.sessions.startsAt, start), lt(s.sessions.startsAt, new Date(+start + 86_400_000))))).map((r) => r.c));
  const meetings = (await db.select().from(s.meetings).where(eq(s.meetings.day, p.day))).filter((m) => !existing.has(m.classId));
  if (!meetings.length) return;
  await db.insert(s.sessions).values(meetings.map((m) => ({
    classId: m.classId, roomId: m.roomId,
    startsAt: atLocal(p.y, p.m, p.d, m.startMin),
    endsAt: atLocal(p.y, p.m, p.d, m.endMin),
  }))).onConflictDoNothing();
}

/** Send the H-2h prompt for one session: new magic token, SLA deadline, notify lecturer. */
export async function promptSession(sessionId: string, now = new Date()) {
  const token = randomBytes(24).toString("base64url");
  const [row] = await db.select({ ses: s.sessions, klass: s.classes, lecturer: s.users })
    .from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .innerJoin(s.users, eq(s.users.id, s.classes.lecturerId))
    .where(eq(s.sessions.id, sessionId)).limit(1);
  if (!row) return null;

  const deadline = new Date(Math.max(+row.ses.startsAt, +now) + SLA_GRACE_MIN * 60_000);
  const [ses] = await db.update(s.sessions).set({
    status: "pending", promptedAt: now, slaDeadline: deadline, respondedAt: null, delayMinutes: null,
    tokenHash: hashToken(token), proposals: null, lockedSlot: null,
    version: sql`${s.sessions.version} + 1`, updatedAt: now,
  }).where(eq(s.sessions.id, sessionId)).returning();

  const url = `${env.APP_URL}/l/${token}`;
  await sendLecturerPrompt({
    chatId: row.lecturer.telegramChatId, url,
    text: `ClassPause: "${row.klass.name} (${row.klass.section})" starts ${fmtRange(row.ses.startsAt, row.ses.endsAt)}. Tap once to update your students.`,
  });
  await logEvent(sessionId, "prompt", `1-tap card sent to ${row.lecturer.name}`);
  publish({ type: "prompt", sessionId, classId: row.klass.id, tone: "info", message: `H-2h: confirmation request sent to ${row.lecturer.name}` });
  return { session: ses, token, url };
}

/**
 * The protocol clock. Run every ~15s by instrumentation and on demand by /api/cron/tick.
 * 1. materialise today's sessions; 2. prompt sessions entering H-2h; 3. expire missed SLAs.
 */
export async function tick(now = new Date()) {
  await ensureSessionsFor(now);

  const due = await db.select({ id: s.sessions.id }).from(s.sessions).where(and(
    eq(s.sessions.status, "scheduled"), isNull(s.sessions.promptedAt),
    lte(s.sessions.startsAt, new Date(+now + PROMPT_LEAD_MIN * 60_000)),
    // Never prompt a class whose H+15m window has already passed.
    gte(s.sessions.startsAt, new Date(+now - SLA_GRACE_MIN * 60_000)),
  ));
  for (const d of due) await promptSession(d.id, now);

  // Conditional update = no race with a lecturer answering at the last second.
  const expired = await db.update(s.sessions)
    .set({ status: "micropause", respondedAt: now, version: sql`${s.sessions.version} + 1`, updatedAt: now })
    .where(and(eq(s.sessions.status, "pending"), lt(s.sessions.slaDeadline, now)))
    .returning({ id: s.sessions.id, classId: s.sessions.classId });
  for (const e of expired) {
    await logEvent(e.id, "sla_expired", "No reply by H+15m: switched to Micro-Pause");
    publish({ type: "session", sessionId: e.id, classId: e.classId, tone: "warn", message: "SLA expired at H+15m: class auto-switched to Micro-Pause" });
  }
  return { prompted: due.length, expired: expired.length };
}

const ACTION_STATUS: Record<"confirm" | "delay" | "reschedule" | "micropause", SessionStatus> = {
  confirm: "confirmed", delay: "delayed", reschedule: "reschedule", micropause: "micropause",
};
const ACTION_MSG = {
  confirm: "Lecturer confirmed: green departure signal",
  delay: "Lecturer delayed the class by 20 minutes",
  reschedule: "Lecturer requested a reschedule: slot engine running",
  micropause: "Lecturer converted the class to Micro-Pause",
} as const;

export async function respond(sessionId: string, action: keyof typeof ACTION_STATUS, actorId: string | null) {
  const now = new Date();
  const proposals = action === "reschedule" ? await proposeSlots(sessionId, now) : null;
  const [ses] = await db.update(s.sessions).set({
    status: ACTION_STATUS[action], respondedAt: now,
    delayMinutes: action === "delay" ? 20 : null,
    proposals, tokenHash: null,
    version: sql`${s.sessions.version} + 1`, updatedAt: now,
  }).where(and(eq(s.sessions.id, sessionId), inArray(s.sessions.status, ["pending", "scheduled"]))).returning();
  if (!ses) return { ok: false as const, error: "This class already has an answer." };

  await logEvent(sessionId, `lecturer_${action}`, ACTION_MSG[action], actorId);
  publish({ type: "session", sessionId, classId: ses.classId, tone: action === "confirm" ? "ok" : "warn", message: ACTION_MSG[action] });
  return { ok: true as const, session: ses };
}

export async function respondByToken(token: string, action: keyof typeof ACTION_STATUS) {
  const [ses] = await db.select({ id: s.sessions.id, deadline: s.sessions.slaDeadline })
    .from(s.sessions).where(eq(s.sessions.tokenHash, hashToken(token))).limit(1);
  if (!ses) return { ok: false as const, error: "This link was already used or has expired." };
  if (ses.deadline && ses.deadline < new Date()) return { ok: false as const, error: "The 15-minute window has passed; the class moved to Micro-Pause." };
  return respond(ses.id, action, null);
}

export async function lockSlot(sessionId: string, slotId: string, actorId: string) {
  const [cur] = await db.select().from(s.sessions).where(eq(s.sessions.id, sessionId)).limit(1);
  if (!cur || cur.status !== "reschedule") return { ok: false as const, error: "No reschedule is waiting for this class." };
  const slot = cur.proposals?.find((p) => p.id === slotId);
  if (!slot) return { ok: false as const, error: "That slot is no longer offered." };

  const isAsync = slot.kind === "async";
  const [ses] = await db.update(s.sessions).set({
    status: isAsync ? "micropause" : "rescheduled", lockedSlot: slot,
    version: sql`${s.sessions.version} + 1`, updatedAt: new Date(),
  }).where(and(eq(s.sessions.id, sessionId), eq(s.sessions.version, cur.version))).returning();
  if (!ses) return { ok: false as const, error: "Someone else just changed this class. Refresh and try again." };

  const msg = isAsync ? "Komti chose Micro-Pause + Q&A" : `Rescheduled to ${fmtDay(slot.startsAt!)} ${fmtRange(slot.startsAt!, slot.endsAt!)} · ${slot.roomCode}`;
  await logEvent(sessionId, "slot_locked", msg, actorId);
  publish({ type: "session", sessionId, classId: ses.classId, tone: "ok", message: `Broadcast: ${msg}` });
  return { ok: true as const, slot: slot as SlotProposal };
}

export async function submitQuiz(sessionId: string, userId: string, answers: number[]) {
  const [row] = await db.select({ ses: s.sessions, mod: s.microModules })
    .from(s.sessions)
    .innerJoin(s.microModules, eq(s.microModules.classId, s.sessions.classId))
    .innerJoin(s.enrollments, and(eq(s.enrollments.classId, s.sessions.classId), eq(s.enrollments.userId, userId)))
    .where(eq(s.sessions.id, sessionId)).limit(1);
  if (!row) return { ok: false as const, error: "You are not enrolled in this class." };
  if (row.ses.status !== "micropause") return { ok: false as const, error: "Micro-Pause is not active for this class." };
  if (answers.length !== row.mod.quiz.length) return { ok: false as const, error: "Answer every question." };

  const correct = row.mod.quiz.reduce((n, q, i) => n + (q.answer === answers[i] ? 1 : 0), 0);
  const code = `CP-${randomBytes(3).toString("hex").toUpperCase()}`;
  const [rec] = await db.insert(s.attendanceReceipts)
    .values({ sessionId, userId, correct, total: row.mod.quiz.length, code })
    .onConflictDoUpdate({
      target: [s.attendanceReceipts.sessionId, s.attendanceReceipts.userId],
      set: { correct, total: row.mod.quiz.length },
    }).returning();

  publish({ type: "receipt", sessionId, classId: row.ses.classId, tone: "ok", message: "A student completed Micro-Pause" });
  return { ok: true as const, receipt: rec };
}

export async function requestPermission(sessionId: string, userId: string, type: "sick" | "dispensation", note: string) {
  const [enr] = await db.select({ classId: s.sessions.classId }).from(s.sessions)
    .innerJoin(s.enrollments, and(eq(s.enrollments.classId, s.sessions.classId), eq(s.enrollments.userId, userId)))
    .where(eq(s.sessions.id, sessionId)).limit(1);
  if (!enr) return { ok: false as const, error: "You are not enrolled in this class." };
  await db.insert(s.permissions).values({ sessionId, userId, type, note })
    .onConflictDoUpdate({ target: [s.permissions.sessionId, s.permissions.userId], set: { type, note, status: "pending", decidedAt: null, decidedBy: null } });
  publish({ type: "permission", sessionId, classId: enr.classId, tone: "info", message: "New permission request in the komti queue" });
  return { ok: true as const };
}

export async function decidePermission(permissionId: string, decision: "approved" | "rejected", actorId: string) {
  const [p] = await db.update(s.permissions).set({ status: decision, decidedBy: actorId, decidedAt: new Date() })
    .where(and(eq(s.permissions.id, permissionId), eq(s.permissions.status, "pending"))).returning();
  if (!p) return { ok: false as const, error: "Already decided." };
  const [ses] = await db.select({ classId: s.sessions.classId }).from(s.sessions).where(eq(s.sessions.id, p.sessionId));
  publish({ type: "permission", sessionId: p.sessionId, classId: ses.classId, tone: "ok", message: `Permission ${decision}` });
  return { ok: true as const };
}

/* ---------- Demo controls (DEMO_MODE only) ---------- */

/** Restart a class's session as "starting now" so the full H-2h → H+15m flow fits a live demo. */
export async function demoRestart(classId: string) {
  const now = new Date();
  const [m] = await db.select().from(s.meetings).where(eq(s.meetings.classId, classId)).limit(1);
  const today = startOfLocalDay(now);
  const tomorrow = new Date(+today + 86_400_000);
  await db.delete(s.sessions).where(and(eq(s.sessions.classId, classId), gte(s.sessions.startsAt, today), lt(s.sessions.startsAt, tomorrow)));
  const startsAt = new Date(Math.ceil(+now / 60_000) * 60_000);
  const [ses] = await db.insert(s.sessions).values({
    classId, roomId: m.roomId, startsAt, endsAt: new Date(+startsAt + 100 * 60_000),
  }).returning();
  await logEvent(ses.id, "demo_reset", "Demo: session restarted");
  return promptSession(ses.id, now);
}

export async function demoExpire(sessionId: string) {
  await db.update(s.sessions).set({ slaDeadline: new Date(Date.now() - 1000) })
    .where(and(eq(s.sessions.id, sessionId), eq(s.sessions.status, "pending")));
  return tick();
}
