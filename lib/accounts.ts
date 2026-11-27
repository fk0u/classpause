import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { revalidateTag } from "next/cache";
import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { User } from "@/db/schema";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
type R<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
const no = (error: string) => ({ ok: false as const, error });

/* ---------- Passwords ---------- */

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scrypt(pw, salt, 64)).toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string | null) {
  if (!stored) { await scrypt(pw, randomBytes(16), 64); return false; } // same cost either way
  const [salt, hash] = stored.split(":");
  const got = await scrypt(pw, Buffer.from(salt, "hex"), 64);
  const want = Buffer.from(hash, "hex");
  return want.length === got.length && timingSafeEqual(got, want);
}

/** Codes people read aloud or type on a phone: no 0/O/1/I/L. */
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const newCode = (n = 6) => Array.from(randomBytes(n), (b) => ALPHA[b % ALPHA.length]).join("");

/* ---------- Sign-up / sign-in ---------- */

export async function register(input: { name: string; email: string; password: string; studentNo?: string; claim?: string }): Promise<R<User>> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  if (input.claim) {
    const [u] = await db.select().from(s.users).where(and(eq(s.users.claimCode, input.claim.trim().toUpperCase()), isNull(s.users.passwordHash))).limit(1);
    if (!u) return no("This lecturer code is invalid or already used.");
    if (u.email !== email) return no("Use the email your komti registered for you.");
    const [done] = await db.update(s.users).set({ passwordHash, claimCode: null, name: input.name.trim() || u.name }).where(eq(s.users.id, u.id)).returning();
    return { ok: true, data: done };
  }
  const [taken] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).limit(1);
  if (taken) return no("This email already has an account. Sign in instead.");
  const [u] = await db.insert(s.users).values({ name: input.name.trim(), email, role: "student", studentNo: input.studentNo?.trim() || null, passwordHash }).returning();
  return { ok: true, data: u };
}

export async function login(email: string, password: string): Promise<R<User>> {
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email.trim().toLowerCase())).limit(1);
  const ok = await verifyPassword(password, u?.passwordHash ?? null);
  if (!u || !ok) return no("Wrong email or password.");
  return { ok: true, data: u };
}

/* ---------- Class groups ---------- */

export async function myCohorts(userId: string) {
  const member = db.select({ id: s.cohortMembers.cohortId }).from(s.cohortMembers).where(eq(s.cohortMembers.userId, userId));
  const teaching = db.select({ id: s.classes.cohortId }).from(s.classes).where(eq(s.classes.lecturerId, userId));
  const [a, b] = await Promise.all([member, teaching]);
  const ids = [...new Set([...a, ...b].map((r) => r.id).filter(Boolean) as string[])];
  return ids.length ? db.select().from(s.cohorts).where(inArray(s.cohorts.id, ids)).orderBy(asc(s.cohorts.createdAt)) : [];
}

export async function createCohort(userId: string, name: string, program: string): Promise<R<string>> {
  for (let i = 0; i < 5; i++) {
    try {
      const [c] = await db.insert(s.cohorts).values({ name: name.trim(), program: program.trim(), inviteCode: newCode(), komtiId: userId }).returning();
      await db.insert(s.cohortMembers).values({ cohortId: c.id, userId }).onConflictDoNothing();
      await db.update(s.users).set({ role: "komti" }).where(and(eq(s.users.id, userId), ne(s.users.role, "lecturer")));
      return { ok: true, data: c.id };
    } catch (e) { if (!String(e).includes("invite_code")) throw e; }
  }
  return no("Try again.");
}

export async function joinCohort(userId: string, code: string): Promise<R<string>> {
  const [c] = await db.select().from(s.cohorts).where(eq(s.cohorts.inviteCode, code.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""))).limit(1);
  if (!c) return no("No class group uses this code.");
  await db.insert(s.cohortMembers).values({ cohortId: c.id, userId }).onConflictDoNothing();
  const classes = await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.cohortId, c.id));
  if (classes.length) await db.insert(s.enrollments).values(classes.map((k) => ({ classId: k.id, userId }))).onConflictDoNothing();
  return { ok: true, data: c.id };
}

/** The cohort this user runs as komti, or null. */
export async function komtiCohort(userId: string) {
  const [c] = await db.select().from(s.cohorts).where(eq(s.cohorts.komtiId, userId)).orderBy(asc(s.cohorts.createdAt)).limit(1);
  return c ?? null;
}

async function syncRole(userId: string) {
  const [u] = await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId));
  if (!u || u.role === "lecturer") return;
  const [still] = await db.select({ id: s.cohorts.id }).from(s.cohorts).where(eq(s.cohorts.komtiId, userId)).limit(1);
  await db.update(s.users).set({ role: still ? "komti" : "student" }).where(eq(s.users.id, userId));
}

async function isMember(cohortId: string, userId: string) {
  const [m] = await db.select().from(s.cohortMembers).where(and(eq(s.cohortMembers.cohortId, cohortId), eq(s.cohortMembers.userId, userId))).limit(1);
  return Boolean(m);
}

export async function transferKomti(cohortId: string, from: string, to: string): Promise<R> {
  const [c] = await db.select().from(s.cohorts).where(eq(s.cohorts.id, cohortId)).limit(1);
  if (!c || c.komtiId !== from) return no("Komti of this class group only");
  if (to === from || !(await isMember(cohortId, to))) return no("Pick another member of this class group.");
  await db.update(s.cohorts).set({ komtiId: to }).where(eq(s.cohorts.id, cohortId));
  await db.update(s.classes).set({ komtiId: to }).where(eq(s.classes.cohortId, cohortId));
  await syncRole(to); await syncRole(from);
  revalidateTag("catalog");
  return { ok: true };
}

/** Komti assigns any member; the current SiPen can hand it to another member. */
export async function setSipen(classId: string, actor: string, to: string | null): Promise<R> {
  const [k] = await db.select({ k: s.classes, komti: s.cohorts.komtiId }).from(s.classes)
    .innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(eq(s.classes.id, classId)).limit(1);
  if (!k) return no("Unknown course");
  if (k.komti !== actor && k.k.sipenId !== actor) return no("Komti or this course's SiPen only");
  if (to && !(await isMember(k.k.cohortId!, to))) return no("Pick another member of this class group.");
  if (!to && k.komti !== actor) return no("Pick another member of this class group.");
  await db.update(s.classes).set({ sipenId: to }).where(eq(s.classes.id, classId));
  return { ok: true };
}

export async function regenerateInvite(cohortId: string, komti: string): Promise<R<string>> {
  const code = newCode();
  const r = await db.update(s.cohorts).set({ inviteCode: code }).where(and(eq(s.cohorts.id, cohortId), eq(s.cohorts.komtiId, komti))).returning();
  return r.length ? { ok: true, data: code } : no("Komti of this class group only");
}

export async function updateCohort(cohortId: string, komti: string, name: string, program: string): Promise<R> {
  const r = await db.update(s.cohorts).set({ name: name.trim(), program: program.trim() }).where(and(eq(s.cohorts.id, cohortId), eq(s.cohorts.komtiId, komti))).returning();
  return r.length ? { ok: true } : no("Komti of this class group only");
}

/* ---------- Komti fills in courses, lecturers and the timetable ---------- */

async function ownCohort(cohortId: string, komti: string) {
  const [c] = await db.select().from(s.cohorts).where(and(eq(s.cohorts.id, cohortId), eq(s.cohorts.komtiId, komti))).limit(1);
  return c ?? null;
}

/** Reuses a lecturer account with this email, or creates an unclaimed one with a claim code. */
export async function upsertLecturer(name: string, email: string): Promise<R<string>> {
  const e = email.trim().toLowerCase();
  const [u] = await db.select().from(s.users).where(eq(s.users.email, e)).limit(1);
  if (u) return u.role === "lecturer" ? { ok: true, data: u.id } : no("This email belongs to a student account.");
  const [l] = await db.insert(s.users).values({ name: name.trim(), email: e, role: "lecturer", claimCode: newCode(8) }).returning();
  return { ok: true, data: l.id };
}

export async function addCourse(cohortId: string, komti: string, c: { code: string; name: string; credits: number; lecturerName: string; lecturerEmail: string }): Promise<R<string>> {
  const co = await ownCohort(cohortId, komti);
  if (!co) return no("Komti of this class group only");
  const lec = await upsertLecturer(c.lecturerName, c.lecturerEmail);
  if (!lec.ok) return lec;
  const code = c.code.trim().toUpperCase();
  const [dupe] = await db.select({ id: s.classes.id }).from(s.classes).where(and(eq(s.classes.cohortId, cohortId), eq(s.classes.code, code))).limit(1);
  if (dupe) return no("This course code is already in your class group.");
  const [k] = await db.insert(s.classes).values({ code, name: c.name.trim(), section: co.name, credits: c.credits, lecturerId: lec.data!, komtiId: komti, cohortId }).returning();
  const members = await db.select({ userId: s.cohortMembers.userId }).from(s.cohortMembers).where(eq(s.cohortMembers.cohortId, cohortId));
  if (members.length) await db.insert(s.enrollments).values(members.map((m) => ({ classId: k.id, userId: m.userId }))).onConflictDoNothing();
  revalidateTag("catalog");
  return { ok: true, data: k.id };
}

export async function updateCourse(classId: string, komti: string, c: { name: string; credits: number; lecturerName: string; lecturerEmail: string }): Promise<R> {
  const [k] = await db.select().from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  const lec = await upsertLecturer(c.lecturerName, c.lecturerEmail);
  if (!lec.ok) return lec;
  await db.update(s.classes).set({ name: c.name.trim(), credits: c.credits, lecturerId: lec.data! }).where(eq(s.classes.id, classId));
  revalidateTag("catalog");
  return { ok: true };
}

export async function removeCourse(classId: string, komti: string): Promise<R> {
  const [k] = await db.select({ id: s.classes.id }).from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  await db.delete(s.classes).where(eq(s.classes.id, classId));
  revalidateTag("catalog");
  return { ok: true };
}

export async function addMeeting(classId: string, komti: string, m: { day: number; startMin: number; endMin: number; room: string }): Promise<R> {
  const [k] = await db.select({ id: s.classes.id }).from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  if (m.endMin <= m.startMin) return no("The class must end after it starts.");
  const code = m.room.trim().toUpperCase();
  let [room] = await db.select().from(s.rooms).where(eq(s.rooms.code, code)).limit(1);
  if (!room) [room] = await db.insert(s.rooms).values({ code, building: code.split("-")[0] || code, capacity: 40 }).returning();
  const clash = await db.select({ id: s.meetings.id, start: s.meetings.startMin, end: s.meetings.endMin }).from(s.meetings)
    .where(and(eq(s.meetings.roomId, room.id), eq(s.meetings.day, m.day)));
  if (clash.some((c) => c.start < m.endMin && m.startMin < c.end)) return no("That room is already booked at this time.");
  await db.insert(s.meetings).values({ classId, roomId: room.id, day: m.day, startMin: m.startMin, endMin: m.endMin });
  revalidateTag("catalog");
  return { ok: true };
}

export async function removeMeeting(meetingId: string, komti: string): Promise<R> {
  const [m] = await db.select({ id: s.meetings.id }).from(s.meetings).innerJoin(s.classes, eq(s.classes.id, s.meetings.classId))
    .innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(and(eq(s.meetings.id, meetingId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!m) return no("Komti of this class group only");
  await db.delete(s.meetings).where(eq(s.meetings.id, meetingId));
  revalidateTag("catalog");
  return { ok: true };
}

/** Everything the manage page shows. Komti sees all; a SiPen sees only their courses. */
export async function manageView(userId: string) {
  const cohorts = await myCohorts(userId);
  const out = [];
  for (const c of cohorts) {
    const isKomti = c.komtiId === userId;
    const courses = await db.select({ k: s.classes, lec: { id: s.users.id, name: s.users.name, email: s.users.email, claimCode: s.users.claimCode } })
      .from(s.classes).innerJoin(s.users, eq(s.users.id, s.classes.lecturerId))
      .where(and(eq(s.classes.cohortId, c.id), isKomti ? undefined : eq(s.classes.sipenId, userId))).orderBy(asc(s.classes.code));
    if (!isKomti && !courses.length) continue;
    const ids = courses.map((x) => x.k.id);
    const [meetings, members] = await Promise.all([
      ids.length ? db.select({ m: s.meetings, room: s.rooms.code }).from(s.meetings).innerJoin(s.rooms, eq(s.rooms.id, s.meetings.roomId)).where(inArray(s.meetings.classId, ids)).orderBy(asc(s.meetings.day), asc(s.meetings.startMin)) : [],
      db.select({ id: s.users.id, name: s.users.name, studentNo: s.users.studentNo }).from(s.cohortMembers).innerJoin(s.users, eq(s.users.id, s.cohortMembers.userId))
        .where(eq(s.cohortMembers.cohortId, c.id)).orderBy(asc(s.users.name)),
    ]);
    out.push({
      cohort: { id: c.id, name: c.name, program: c.program, inviteCode: isKomti ? c.inviteCode : null, komtiId: c.komtiId },
      isKomti,
      members,
      courses: courses.map(({ k, lec }) => ({
        id: k.id, code: k.code, name: k.name, credits: k.credits, sipenId: k.sipenId,
        lecturer: { name: lec.name, email: lec.email, claimCode: isKomti ? lec.claimCode : null },
        meetings: meetings.filter((m) => m.m.classId === k.id).map((m) => ({ id: m.m.id, day: m.m.day, startMin: m.m.startMin, endMin: m.m.endMin, room: m.room })),
      })),
    });
  }
  return out;
}

export async function sipenCourses(userId: string) {
  return db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.sipenId, userId));
}

/** True when the user is komti of the course's group, its SiPen, or its lecturer. */
export async function courseRole(classId: string, userId: string) {
  const [k] = await db.select({ komti: s.cohorts.komtiId, sipen: s.classes.sipenId, lecturer: s.classes.lecturerId, oldKomti: s.classes.komtiId })
    .from(s.classes).leftJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(eq(s.classes.id, classId)).limit(1);
  if (!k) return null;
  return k.lecturer === userId ? "lecturer" : (k.komti ?? k.oldKomti) === userId ? "komti" : k.sipen === userId ? "sipen" : null;
}

