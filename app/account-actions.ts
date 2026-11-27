"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { currentUser, signIn, homeFor } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uuid, type ActionResult } from "@/lib/validation";
import * as A from "@/lib/accounts";
import * as S from "@/lib/stream";

const fail = (error: string) => ({ ok: false as const, error });
const zodFail = (e: z.ZodError) => fail(e.issues[0]?.message ?? "Invalid input");
const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

const email = z.string().trim().toLowerCase().email("Enter a valid email").max(120);
const password = z.string().min(8, "Password must be at least 8 characters").max(200);

/* ---------- Auth ---------- */

export async function loginAction(input: unknown): Promise<ActionResult> {
  const p = z.object({ email, password: z.string().min(1).max(200) }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (!rateLimit(`login:${await ip()}`, 10, 60_000) || !rateLimit(`login:${p.data.email}`, 10, 10 * 60_000)) return fail("Too many attempts. Wait a minute.");
  const r = await A.login(p.data.email, p.data.password);
  if (!r.ok) return r;
  await signIn(r.data!.id);
  redirect(homeFor(r.data!.role));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80), email, password,
  studentNo: z.string().trim().max(20).optional(), claim: z.string().trim().max(12).optional(),
});
export async function registerAction(input: unknown): Promise<ActionResult> {
  const p = registerSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (!rateLimit(`register:${await ip()}`, 5, 10 * 60_000)) return fail("Too many attempts. Wait a minute.");
  const r = await A.register(p.data);
  if (!r.ok) return r;
  await signIn(r.data!.id);
  redirect(r.data!.role === "lecturer" ? "/lecturer" : "/join");
}

/* ---------- Class groups ---------- */

export async function joinAction(code: unknown): Promise<ActionResult> {
  const u = await currentUser();
  const c = z.string().trim().min(4).max(12).safeParse(code);
  if (!u || !c.success) return fail("No class group uses this code.");
  if (!rateLimit(`join:${u.id}`, 10, 60_000)) return fail("Too many attempts. Wait a minute.");
  const r = await A.joinCohort(u.id, c.data);
  if (!r.ok) return r;
  redirect("/stream");
}

const cohortSchema = z.object({ name: z.string().trim().min(2).max(60), program: z.string().trim().min(2).max(60) });
export async function createCohortAction(input: unknown): Promise<ActionResult> {
  const u = await currentUser();
  const p = cohortSchema.safeParse(input);
  if (!u || u.role === "lecturer") return fail("Students only");
  if (!p.success) return zodFail(p.error);
  const r = await A.createCohort(u.id, p.data.name, p.data.program);
  if (!r.ok) return r;
  redirect("/manage");
}

async function me() {
  const u = await currentUser();
  if (!u) throw new Error("Not signed in");
  return u;
}
const done = (r: { ok: boolean; error?: string }): ActionResult => (r.ok ? { ok: true } : fail(r.error!));

export async function updateCohortAction(input: unknown) {
  const p = cohortSchema.extend({ cohortId: uuid }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  return done(await A.updateCohort(p.data.cohortId, (await me()).id, p.data.name, p.data.program));
}

export async function regenerateInviteAction(cohortId: unknown) {
  const id = uuid.safeParse(cohortId);
  if (!id.success) return fail("Bad request");
  return done(await A.regenerateInvite(id.data, (await me()).id));
}

export async function transferKomtiAction(input: unknown) {
  const p = z.object({ cohortId: uuid, to: uuid }).safeParse(input);
  if (!p.success) return fail("Bad request");
  const r = await A.transferKomti(p.data.cohortId, (await me()).id, p.data.to);
  if (!r.ok) return r;
  redirect("/stream");
}

export async function setSipenAction(input: unknown) {
  const p = z.object({ classId: uuid, to: uuid.nullable() }).safeParse(input);
  if (!p.success) return fail("Bad request");
  return done(await A.setSipen(p.data.classId, (await me()).id, p.data.to));
}

const courseSchema = z.object({
  code: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and - only"),
  name: z.string().trim().min(2).max(80),
  credits: z.coerce.number().int().min(1).max(6),
  lecturerName: z.string().trim().min(2, "Enter the lecturer's name").max(80),
  lecturerEmail: z.union([z.literal(""), email]).optional(),
});
export async function addCourseAction(input: unknown) {
  const p = courseSchema.extend({ cohortId: uuid }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  return done(await A.addCourse(p.data.cohortId, (await me()).id, p.data));
}

export async function updateCourseAction(input: unknown) {
  const p = courseSchema.omit({ code: true }).extend({ classId: uuid }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  return done(await A.updateCourse(p.data.classId, (await me()).id, p.data));
}

export async function removeCourseAction(classId: unknown) {
  const id = uuid.safeParse(classId);
  if (!id.success) return fail("Bad request");
  return done(await A.removeCourse(id.data, (await me()).id));
}

const hhmm = z.string().regex(/^\d{2}:\d{2}$/).transform((v) => +v.slice(0, 2) * 60 + +v.slice(3));
export async function addMeetingAction(input: unknown) {
  const p = z.object({ classId: uuid, day: z.coerce.number().int().min(1).max(7), start: hhmm, end: hhmm, room: z.string().trim().min(1).max(20) }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  return done(await A.addMeeting(p.data.classId, (await me()).id, { day: p.data.day, startMin: p.data.start, endMin: p.data.end, room: p.data.room }));
}

export async function removeMeetingAction(meetingId: unknown) {
  const id = uuid.safeParse(meetingId);
  if (!id.success) return fail("Bad request");
  return done(await A.removeMeeting(id.data, (await me()).id));
}

/* ---------- Stream ---------- */

export async function createPostAction(input: unknown) {
  const p = z.object({ cohortId: uuid, classId: uuid.nullable(), kind: z.enum(["announcement", "discussion", "info"]), body: z.string().trim().min(1).max(2000) }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  const u = await me();
  if (!rateLimit(`post:${u.id}`, 10, 60_000)) return fail("Too many attempts. Wait a minute.");
  return done(await S.createPost(u.id, p.data));
}

export async function commentAction(input: unknown) {
  const p = z.object({ postId: uuid, body: z.string().trim().min(1).max(1000) }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  const u = await me();
  if (!rateLimit(`comment:${u.id}`, 20, 60_000)) return fail("Too many attempts. Wait a minute.");
  return done(await S.comment(u.id, p.data.postId, p.data.body));
}

export async function pinPostAction(postId: unknown) {
  const id = uuid.safeParse(postId);
  if (!id.success) return fail("Bad request");
  return done(await S.pinPost((await me()).id, id.data));
}

export async function deletePostAction(postId: unknown) {
  const id = uuid.safeParse(postId);
  if (!id.success) return fail("Bad request");
  return done(await S.deletePost((await me()).id, id.data));
}

/* ---------- Profile & membership ---------- */

export async function updateProfileAction(input: unknown) {
  const p = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), email, studentNo: z.string().trim().max(20).optional(), password: z.string().max(200).optional() }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  return done(await A.updateProfile((await me()).id, p.data));
}

export async function changePasswordAction(input: unknown) {
  const p = z.object({ current: z.string().min(1).max(200), next: password }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  const u = await me();
  if (!rateLimit(`pw:${u.id}`, 5, 10 * 60_000)) return fail("Too many attempts. Wait a minute.");
  return done(await A.changePassword(u.id, p.data.current, p.data.next));
}

export async function leaveCohortAction(cohortId: unknown) {
  const id = uuid.safeParse(cohortId);
  if (!id.success) return fail("Bad request");
  return done(await A.leaveCohort(id.data, (await me()).id));
}

export async function removeMemberAction(input: unknown) {
  const p = z.object({ cohortId: uuid, userId: uuid }).safeParse(input);
  if (!p.success) return fail("Bad request");
  return done(await A.removeMember(p.data.cohortId, (await me()).id, p.data.userId));
}

export async function deleteCohortAction(input: unknown) {
  const p = z.object({ cohortId: uuid, confirm: z.string().max(80) }).safeParse(input);
  if (!p.success) return fail("Bad request");
  const r = await A.deleteCohort(p.data.cohortId, (await me()).id, p.data.confirm);
  if (!r.ok) return r;
  redirect("/settings");
}

export async function deleteAccountAction(input: unknown) {
  const p = z.object({ password: z.string().min(1).max(200) }).safeParse(input);
  if (!p.success) return fail("Your current password is wrong.");
  const u = await me();
  if (!rateLimit(`del:${u.id}`, 5, 10 * 60_000)) return fail("Too many attempts. Wait a minute.");
  const r = await A.deleteAccount(u.id, p.data.password);
  if (!r.ok) return r;
  const { signOut } = await import("@/lib/auth");
  await signOut();
  redirect("/login");
}
