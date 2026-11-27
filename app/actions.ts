"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { currentUser, signIn, signOut, homeFor } from "@/lib/auth";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import * as P from "@/lib/protocol";
import { db, schema as s } from "@/db";
import { and, eq } from "drizzle-orm";
import {
  lecturerActionSchema, magicActionSchema, lockSlotSchema, permissionSchema,
  decidePermissionSchema, quizSubmitSchema, signInSchema, uuid, type ActionResult,
} from "@/lib/validation";

const fail = (error: string) => ({ ok: false as const, error });
const zodFail = (e: z.ZodError) => fail(e.issues[0]?.message ?? "Invalid input");

async function guard(key: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return rateLimit(`${key}:${ip}`, 30, 60_000);
}

export async function signInAction(input: unknown) {
  const p = signInSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const [u] = await db.select().from(s.users).where(eq(s.users.id, p.data.userId)).limit(1);
  if (!u) return fail("Unknown account");
  await signIn(u.id);
  redirect(homeFor(u.role));
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}

export async function lecturerAction(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u || u.role !== "lecturer") return fail("Lecturers only");
  const p = lecturerActionSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const [own] = await db.select({ id: s.sessions.id }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(eq(s.sessions.id, p.data.sessionId), eq(s.classes.lecturerId, u.id))).limit(1);
  if (!own) return fail("Not your class");
  const r = await P.respond(p.data.sessionId, p.data.action, u.id);
  return r.ok ? { ok: true } : r;
}

/** Magic-link action: no login, the single-use token is the credential. */
export async function magicAction(input: unknown): Promise<ActionResult> {
  if (!(await guard("magic"))) return fail("Too many attempts, wait a minute");
  const p = magicActionSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const r = await P.respondByToken(p.data.token, p.data.action);
  return r.ok ? { ok: true } : r;
}

async function requireKomtiOf(sessionId: string) {
  const u = await currentUser();
  if (!u || u.role !== "komti") return null;
  const [own] = await db.select({ id: s.sessions.id }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(eq(s.sessions.id, sessionId), eq(s.classes.komtiId, u.id))).limit(1);
  return own ? u : null;
}

export async function lockSlotAction(input: unknown): Promise<ActionResult> {
  const p = lockSlotSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const u = await requireKomtiOf(p.data.sessionId);
  if (!u) return fail("Komti of this class only");
  const r = await P.lockSlot(p.data.sessionId, p.data.slotId, u.id);
  return r.ok ? { ok: true } : r;
}

export async function decidePermissionAction(input: unknown): Promise<ActionResult> {
  const p = decidePermissionSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const [perm] = await db.select({ sessionId: s.permissions.sessionId }).from(s.permissions).where(eq(s.permissions.id, p.data.permissionId));
  if (!perm) return fail("Not found");
  // Only the class's lecturer decides, so a request can't stall with the komti.
  const u = await currentUser();
  if (!u || u.role !== "lecturer") return fail("Lecturer of this class only");
  const [own] = await db.select({ id: s.sessions.id }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(and(eq(s.sessions.id, perm.sessionId), eq(s.classes.lecturerId, u.id))).limit(1);
  if (!own) return fail("Lecturer of this class only");
  const r = await P.decidePermission(p.data.permissionId, p.data.decision, u.id);
  return r.ok ? { ok: true } : r;
}

export async function requestPermissionAction(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u || u.role === "lecturer") return fail("Students only");
  if (!(await guard(`perm:${u.id}`))) return fail("Too many requests");
  const p = permissionSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const r = await P.requestPermission(p.data.sessionId, u.id, p.data.type, p.data.note);
  return r.ok ? { ok: true, message: "Sent to your lecturer" } : r;
}

export async function submitQuizAction(input: unknown): Promise<ActionResult<{ code: string; correct: number; total: number }>> {
  const u = await currentUser();
  if (!u || u.role === "lecturer") return fail("Students only");
  const p = quizSubmitSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const r = await P.submitQuiz(p.data.sessionId, u.id, p.data.answers);
  return r.ok ? { ok: true, data: { code: r.receipt.code, correct: r.receipt.correct, total: r.receipt.total } } : r;
}

/* ---------- Demo controls ---------- */

export async function demoRestartAction(classId: unknown): Promise<ActionResult<{ url: string }>> {
  if (!env.DEMO_MODE) return fail("Demo mode is off");
  if (!(await currentUser())) return fail("Sign in first");
  const id = uuid.safeParse(classId);
  if (!id.success) return fail("Bad class");
  const r = await P.demoRestart(id.data);
  return r ? { ok: true, data: { url: r.url } } : fail("Could not restart");
}

export async function demoExpireAction(sessionId: unknown): Promise<ActionResult> {
  if (!env.DEMO_MODE) return fail("Demo mode is off");
  if (!(await currentUser())) return fail("Sign in first");
  const id = uuid.safeParse(sessionId);
  if (!id.success) return fail("Bad session");
  await P.demoExpire(id.data);
  return { ok: true };
}

/* ---------- Profile, language, push, inbox ---------- */

const pushSubSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

export async function savePushSubscription(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u) return fail("Sign in first");
  const p = pushSubSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  await db.insert(s.pushSubscriptions)
    .values({ userId: u.id, endpoint: p.data.endpoint, p256dh: p.data.keys.p256dh, auth: p.data.keys.auth })
    .onConflictDoUpdate({ target: s.pushSubscriptions.endpoint, set: { userId: u.id, p256dh: p.data.keys.p256dh, auth: p.data.keys.auth } });
  return { ok: true };
}

export async function removePushSubscription(endpoint: unknown): Promise<ActionResult> {
  const u = await currentUser();
  const e = z.string().url().safeParse(endpoint);
  if (!u || !e.success) return fail("Bad request");
  await db.delete(s.pushSubscriptions).where(and(eq(s.pushSubscriptions.endpoint, e.data), eq(s.pushSubscriptions.userId, u.id)));
  return { ok: true };
}

export async function sendTestPush(): Promise<ActionResult> {
  const u = await currentUser();
  if (!u) return fail("Sign in first");
  if (!(await guard(`testpush:${u.id}`))) return fail("Too many requests");
  const { notifyUsers } = await import("@/lib/notify");
  await notifyUsers([u.id], "test", (t) => ({ title: t.notif.test.title, body: t.notif.test.body, url: "/profile" }));
  return { ok: true };
}

export async function setLocaleAction(locale: unknown): Promise<ActionResult> {
  const l = z.enum(["en", "id"]).safeParse(locale);
  if (!l.success) return fail("Unsupported language");
  const { cookies } = await import("next/headers");
  (await cookies()).set("cp_locale", l.data, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const u = await currentUser();
  if (u) await db.update(s.users).set({ locale: l.data }).where(eq(s.users.id, u.id));
  return { ok: true };
}

export async function markInboxRead(id?: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u) return fail("Sign in first");
  const { isNull } = await import("drizzle-orm");
  const one = id === undefined ? null : uuid.safeParse(id);
  if (one && !one.success) return fail("Bad id");
  await db.update(s.notifications).set({ readAt: new Date() })
    .where(and(eq(s.notifications.userId, u.id), isNull(s.notifications.readAt), ...(one ? [eq(s.notifications.id, one.data)] : [])));
  return { ok: true };
}

/* ---------- Open rooms & facility reports ---------- */

const claimSchema = z.object({ roomId: uuid, startsAt: z.string().datetime(), purpose: z.string().trim().min(3, "Say what the room is for (3+ characters)").max(80) });
const reportSchema = z.object({
  place: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9 ._-]+$/),
  kind: z.enum(["marker", "projector", "ac", "cleanliness", "parking_full", "other"]),
});

export async function claimRoomAction(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u) return fail("Sign in first");
  if (!(await guard(`claim:${u.id}`))) return fail("Too many requests");
  const p = claimSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const { claimRoom } = await import("@/lib/rooms");
  const r = await claimRoom(u.id, p.data.roomId, p.data.startsAt, p.data.purpose);
  return r.ok ? { ok: true } : r;
}

export async function releaseRoomAction(claimId: unknown): Promise<ActionResult> {
  const u = await currentUser();
  const id = uuid.safeParse(claimId);
  if (!u || !id.success) return fail("Bad request");
  const { releaseRoom } = await import("@/lib/rooms");
  await releaseRoom(u.id, id.data);
  return { ok: true };
}

export async function reportFacilityAction(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  if (!u) return fail("Sign in first");
  if (!(await guard(`report:${u.id}`))) return fail("Too many requests");
  const p = reportSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const { report } = await import("@/lib/rooms");
  await report(u.id, p.data.place, p.data.kind);
  return { ok: true };
}

/** Komti and lecturers can mark a report fixed. */
export async function resolveReportAction(id: unknown): Promise<ActionResult> {
  const u = await currentUser();
  const rid = uuid.safeParse(id);
  if (!u || !rid.success) return fail("Bad request");
  if (u.role === "student") return fail("Komti or lecturer only");
  const { resolveReport } = await import("@/lib/rooms");
  await resolveReport(rid.data);
  return { ok: true };
}
