import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { revalidateTag } from "next/cache";
import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { User } from "@/db/schema";
import { teaches } from "./teach";

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
    // The komti may not know the lecturer's email, so the code alone proves the invite; the lecturer picks their own email.
    const [other] = await db.select({ id: s.users.id }).from(s.users).where(and(eq(s.users.email, email), ne(s.users.id, u.id))).limit(1);
    if (other) return no("This email already has an account. Sign in instead.");
    const [done] = await db.update(s.users).set({ passwordHash, claimCode: null, email, name: input.name.trim() || u.name }).where(eq(s.users.id, u.id)).returning();
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
  const teaching = db.select({ id: s.classes.cohortId }).from(s.classes).where(teaches(userId));
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

/** Placeholder address for a lecturer added without an email; replaced when they claim the account. */
export const PENDING_DOMAIN = "@pending.classpause.invalid";
export const isPendingEmail = (e: string) => e.endsWith(PENDING_DOMAIN);

/** Reuses a lecturer account with this email, or creates an unclaimed one with a claim code. The email is optional. */
export async function upsertLecturer(name: string, email?: string | null): Promise<R<string>> {
  const e = email?.trim().toLowerCase();
  if (e) {
    const [u] = await db.select().from(s.users).where(eq(s.users.email, e)).limit(1);
    if (u) return u.role === "lecturer" ? { ok: true, data: u.id } : no("This email belongs to a student account.");
  }
  const claimCode = newCode(8);
  const [l] = await db.insert(s.users).values({ name: name.trim(), email: e || `lecturer-${claimCode.toLowerCase()}${PENDING_DOMAIN}`, role: "lecturer", claimCode }).returning();
  return { ok: true, data: l.id };
}

export async function addCourse(cohortId: string, komti: string, c: { code: string; name: string; credits: number; lecturerName: string; lecturerEmail?: string | null }): Promise<R<string>> {
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

export async function updateCourse(classId: string, komti: string, c: { name: string; credits: number; lecturerName: string; lecturerEmail?: string | null }): Promise<R> {
  const [k] = await db.select().from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId)).where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  const [cur] = await db.select().from(s.users).where(eq(s.users.id, k.classes.lecturerId)).limit(1);
  const email = c.lecturerEmail?.trim().toLowerCase();
  let lecturerId = cur.id;
  if (email && email !== cur.email) {
    const lec = await upsertLecturer(c.lecturerName, email);
    if (!lec.ok) return lec;
    lecturerId = lec.data!;
  } else if (!cur.passwordHash && c.lecturerName.trim() !== cur.name) {
    // Unclaimed lecturer: the komti may fix the name or fill in an email later.
    await db.update(s.users).set({ name: c.lecturerName.trim() }).where(eq(s.users.id, cur.id));
  }
  await db.update(s.classes).set({ name: c.name.trim(), credits: c.credits, lecturerId }).where(eq(s.classes.id, classId));
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
    const assistants = ids.length ? await db.select({ classId: s.courseAssistants.classId, id: s.users.id, name: s.users.name, email: s.users.email, claimCode: s.users.claimCode })
      .from(s.courseAssistants).innerJoin(s.users, eq(s.users.id, s.courseAssistants.userId)).where(inArray(s.courseAssistants.classId, ids)).orderBy(asc(s.users.name)) : [];
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
        lecturer: { name: lec.name, email: isPendingEmail(lec.email) ? "" : lec.email, claimCode: isKomti ? lec.claimCode : null },
        assistants: assistants.filter((x) => x.classId === k.id).map((x) => ({ id: x.id, name: x.name, email: isPendingEmail(x.email) ? "" : x.email, claimCode: isKomti ? x.claimCode : null })),
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
  if (k.lecturer === userId) return "lecturer";
  if ((k.komti ?? k.oldKomti) === userId) return "komti";
  if (k.sipen === userId) return "sipen";
  const [a] = await db.select().from(s.courseAssistants).where(and(eq(s.courseAssistants.classId, classId), eq(s.courseAssistants.userId, userId))).limit(1);
  return a ? "assistant" : null;
}


/* ---------- Profile, leaving, deleting ---------- */

const DEMO_LOCK = "Demo accounts can't be changed. Create your own account to try this.";

export async function updateProfile(userId: string, p: { name: string; email: string; studentNo?: string | null; password?: string }): Promise<R> {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  if (!u) return no("Unknown account");
  if (u.isDemo) return no(DEMO_LOCK);
  const email = p.email.trim().toLowerCase();
  if (email !== u.email) {
    if (!(await verifyPassword(p.password ?? "", u.passwordHash))) return no("Enter your current password to change your email.");
    const [taken] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).limit(1);
    if (taken) return no("This email already has an account. Sign in instead.");
  }
  await db.update(s.users).set({ name: p.name.trim(), email, studentNo: u.role === "lecturer" ? u.studentNo : p.studentNo?.trim() || null }).where(eq(s.users.id, userId));
  revalidateTag("catalog");
  return { ok: true };
}

export async function changePassword(userId: string, current: string, next: string): Promise<R> {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  if (!u) return no("Unknown account");
  if (u.isDemo) return no(DEMO_LOCK);
  if (!(await verifyPassword(current, u.passwordHash))) return no("Your current password is wrong.");
  await db.update(s.users).set({ passwordHash: await hashPassword(next) }).where(eq(s.users.id, userId));
  return { ok: true };
}

/** Drops a member from a class group: membership, course enrollments and any SiPen role there. */
async function dropMember(cohortId: string, userId: string) {
  const ids = (await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.cohortId, cohortId))).map((r) => r.id);
  if (ids.length) {
    await db.delete(s.enrollments).where(and(eq(s.enrollments.userId, userId), inArray(s.enrollments.classId, ids)));
    await db.update(s.classes).set({ sipenId: null }).where(and(inArray(s.classes.id, ids), eq(s.classes.sipenId, userId)));
  }
  await db.delete(s.cohortMembers).where(and(eq(s.cohortMembers.cohortId, cohortId), eq(s.cohortMembers.userId, userId)));
}

export async function leaveCohort(cohortId: string, userId: string): Promise<R> {
  const [c] = await db.select().from(s.cohorts).where(eq(s.cohorts.id, cohortId)).limit(1);
  if (!c || !(await isMember(cohortId, userId))) return no("You are not in this class group.");
  if (c.komtiId === userId) return no("Hand over komti first, or delete the class group.");
  const [u] = await db.select({ isDemo: s.users.isDemo }).from(s.users).where(eq(s.users.id, userId));
  if (u?.isDemo) return no(DEMO_LOCK);
  await dropMember(cohortId, userId);
  return { ok: true };
}

export async function removeMember(cohortId: string, komti: string, userId: string): Promise<R> {
  const c = await ownCohort(cohortId, komti);
  if (!c) return no("Komti of this class group only");
  if (userId === komti) return no("Hand over komti first, or delete the class group.");
  await dropMember(cohortId, userId);
  return { ok: true };
}

export async function deleteCohort(cohortId: string, komti: string, confirmName: string): Promise<R> {
  const c = await ownCohort(cohortId, komti);
  if (!c) return no("Komti of this class group only");
  if (c.inviteCode === "DEMO24") return no(DEMO_LOCK);
  if (confirmName.trim() !== c.name) return no("Type the class group name exactly to confirm.");
  await db.delete(s.classes).where(eq(s.classes.cohortId, cohortId));
  await db.delete(s.cohorts).where(eq(s.cohorts.id, cohortId));
  await syncRole(komti);
  revalidateTag("catalog");
  return { ok: true };
}

export async function deleteAccount(userId: string, password: string): Promise<R> {
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  if (!u) return no("Unknown account");
  if (u.isDemo) return no(DEMO_LOCK);
  if (!(await verifyPassword(password, u.passwordHash))) return no("Your current password is wrong.");
  const [leads] = await db.select({ id: s.cohorts.id, others: sql<number>`(select count(*) from cohort_members m where m.cohort_id = ${s.cohorts.id} and m.user_id <> ${userId})` })
    .from(s.cohorts).where(eq(s.cohorts.komtiId, userId)).limit(1);
  if (leads && Number(leads.others) > 0) return no("Hand over komti first, or delete the class group.");
  const [teaches] = await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.lecturerId, userId)).limit(1);
  if (teaches) return no("Ask the komti to move your courses to another lecturer first.");
  // Komti of an empty group: the group goes too.
  const empty = await db.select({ id: s.cohorts.id }).from(s.cohorts).where(eq(s.cohorts.komtiId, userId));
  for (const c of empty) { await db.delete(s.classes).where(eq(s.classes.cohortId, c.id)); await db.delete(s.cohorts).where(eq(s.cohorts.id, c.id)); }
  // Keep other people's records, drop the pointer to this account.
  await db.update(s.classes).set({ komtiId: null }).where(eq(s.classes.komtiId, userId));
  await db.update(s.permissions).set({ decidedBy: null }).where(eq(s.permissions.decidedBy, userId));
  await db.update(s.changeRequests).set({ decidedBy: null }).where(eq(s.changeRequests.decidedBy, userId));
  await db.delete(s.changeRequests).where(eq(s.changeRequests.requestedBy, userId));
  await db.update(s.events).set({ actorId: null }).where(eq(s.events.actorId, userId));
  await db.delete(s.users).where(eq(s.users.id, userId));
  revalidateTag("catalog");
  return { ok: true };
}

/** Class groups this user belongs to, for the settings page. */
export async function memberships(userId: string) {
  return db.select({ id: s.cohorts.id, name: s.cohorts.name, program: s.cohorts.program, komtiId: s.cohorts.komtiId,
    members: sql<number>`(select count(*) from cohort_members m where m.cohort_id = ${s.cohorts.id})` })
    .from(s.cohortMembers).innerJoin(s.cohorts, eq(s.cohorts.id, s.cohortMembers.cohortId))
    .where(eq(s.cohortMembers.userId, userId)).orderBy(asc(s.cohorts.name));
}

/* ---------- Asisten dosen ---------- */

export async function addAssistant(classId: string, komti: string, name: string, email?: string | null): Promise<R> {
  const [k] = await db.select({ id: s.classes.id, lecturerId: s.classes.lecturerId }).from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId))
    .where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  const lec = await upsertLecturer(name, email);
  if (!lec.ok) return lec;
  if (lec.data === k.lecturerId) return no("This person is already the lecturer of this course.");
  await db.insert(s.courseAssistants).values({ classId, userId: lec.data! }).onConflictDoNothing();
  revalidateTag("catalog");
  return { ok: true };
}

export async function removeAssistant(classId: string, komti: string, userId: string): Promise<R> {
  const [k] = await db.select({ id: s.classes.id }).from(s.classes).innerJoin(s.cohorts, eq(s.cohorts.id, s.classes.cohortId))
    .where(and(eq(s.classes.id, classId), eq(s.cohorts.komtiId, komti))).limit(1);
  if (!k) return no("Komti of this class group only");
  await db.delete(s.courseAssistants).where(and(eq(s.courseAssistants.classId, classId), eq(s.courseAssistants.userId, userId)));
  // An asdos the komti created and nobody claimed has no other use: drop the placeholder account.
  const [u] = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  if (u && !u.passwordHash && !u.isDemo) {
    const [still] = await db.select({ id: s.classes.id }).from(s.classes).where(teaches(userId)).limit(1);
    if (!still) await db.delete(s.users).where(eq(s.users.id, userId));
  }
  revalidateTag("catalog");
  return { ok: true };
}
