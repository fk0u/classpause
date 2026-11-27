import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { myCohorts, courseRole } from "./accounts";
import { notifyUsers } from "./notify";
import { teaches } from "./teach";
import { publish } from "./bus";

type R = { ok: true } | { ok: false; error: string };
const no = (error: string) => ({ ok: false as const, error });
export type PostKind = "announcement" | "discussion" | "info";

/** What this user may post where: returns the allowed kinds for a cohort-wide or course post. */
export async function allowedKinds(userId: string, cohortId: string, classId: string | null): Promise<PostKind[]> {
  const [c] = await db.select().from(s.cohorts).where(eq(s.cohorts.id, cohortId)).limit(1);
  if (!c) return [];
  if (classId) {
    const [k] = await db.select({ cohortId: s.classes.cohortId }).from(s.classes).where(eq(s.classes.id, classId)).limit(1);
    if (!k || k.cohortId !== cohortId) return [];
    const role = await courseRole(classId, userId);
    if (role) return ["announcement", "info", "discussion"];
  } else if (c.komtiId === userId) return ["announcement", "info", "discussion"];
  const [m] = await db.select().from(s.cohortMembers).where(and(eq(s.cohortMembers.cohortId, cohortId), eq(s.cohortMembers.userId, userId))).limit(1);
  if (m) return ["discussion"];
  const [teach] = await db.select({ id: s.classes.id }).from(s.classes).where(and(eq(s.classes.cohortId, cohortId), teaches(userId))).limit(1);
  return teach ? ["discussion"] : [];
}

export async function feed(userId: string, opts: { kind?: PostKind; classId?: string; before?: Date } = {}) {
  const cohorts = await myCohorts(userId);
  if (!cohorts.length) return { cohorts: [], courses: [], posts: [], can: {} as Record<string, { cohort: PostKind[]; courses: Record<string, PostKind[]> }> };
  const ids = cohorts.map((c) => c.id);
  const courses = await db.select({ id: s.classes.id, code: s.classes.code, name: s.classes.name, cohortId: s.classes.cohortId, sipenId: s.classes.sipenId, lecturerId: s.classes.lecturerId })
    .from(s.classes).where(inArray(s.classes.cohortId, ids)).orderBy(asc(s.classes.code));
  const asdos = courses.length ? await db.select().from(s.courseAssistants).where(inArray(s.courseAssistants.classId, courses.map((k) => k.id))) : [];
  const teachesK = (k: { id: string; lecturerId: string } | undefined | null, u: string) => Boolean(k && (k.lecturerId === u || asdos.some((a) => a.classId === k.id && a.userId === u)));
  const member = new Set((await db.select({ id: s.cohortMembers.cohortId }).from(s.cohortMembers).where(eq(s.cohortMembers.userId, userId))).map((r) => r.id));
  // Lecturers who aren't members see cohort-wide posts and their own courses only.
  const visibleCourse = courses.filter((k) => member.has(k.cohortId!) || teachesK(k, userId)).map((k) => k.id);
  const scope = or(
    and(inArray(s.posts.cohortId, ids), isNull(s.posts.classId)),
    visibleCourse.length ? inArray(s.posts.classId, visibleCourse) : sql`false`,
  );
  const rows = await db.select({ p: s.posts, author: { id: s.users.id, name: s.users.name, role: s.users.role } })
    .from(s.posts).innerJoin(s.users, eq(s.users.id, s.posts.authorId))
    .where(and(scope, opts.kind ? eq(s.posts.kind, opts.kind) : undefined, opts.classId ? eq(s.posts.classId, opts.classId) : undefined, opts.before ? lt(s.posts.createdAt, opts.before) : undefined))
    .orderBy(desc(s.posts.pinned), desc(s.posts.createdAt)).limit(40);
  const pids = rows.map((r) => r.p.id);
  const comments = pids.length ? await db.select({ c: s.postComments, name: s.users.name }).from(s.postComments).innerJoin(s.users, eq(s.users.id, s.postComments.authorId))
    .where(inArray(s.postComments.postId, pids)).orderBy(asc(s.postComments.createdAt)) : [];

  const komtiOf = new Map(cohorts.map((c) => [c.id, c.komtiId]));
  const badge = (authorId: string, cohortId: string, classId: string | null) => {
    if (komtiOf.get(cohortId) === authorId) return "komti";
    const k = classId ? courses.find((x) => x.id === classId) : null;
    if (k?.lecturerId === authorId || courses.some((x) => x.cohortId === cohortId && x.lecturerId === authorId)) return "lecturer";
    if (teachesK(k, authorId) || courses.some((x) => x.cohortId === cohortId && teachesK(x, authorId))) return "assistant";
    if (k?.sipenId === authorId) return "sipen";
    return null;
  };

  const can: Record<string, { cohort: PostKind[]; courses: Record<string, PostKind[]> }> = {};
  for (const c of cohorts) {
    can[c.id] = { cohort: await allowedKinds(userId, c.id, null), courses: {} };
    for (const k of courses.filter((x) => x.cohortId === c.id && visibleCourse.includes(x.id))) can[c.id].courses[k.id] = await allowedKinds(userId, c.id, k.id);
  }

  return {
    cohorts: cohorts.map((c) => ({ id: c.id, name: c.name, komtiId: c.komtiId })),
    courses: courses.filter((k) => visibleCourse.includes(k.id)).map((k) => ({ id: k.id, code: k.code, name: k.name, cohortId: k.cohortId! })),
    posts: rows.map(({ p, author }) => ({
      id: p.id, kind: p.kind, body: p.body, pinned: p.pinned, createdAt: p.createdAt, cohortId: p.cohortId, classId: p.classId,
      author: { id: author.id, name: author.name, badge: badge(author.id, p.cohortId, p.classId) },
      mine: author.id === userId,
      canModerate: komtiOf.get(p.cohortId) === userId || (p.classId ? teachesK(courses.find((x) => x.id === p.classId), userId) : false),
      comments: comments.filter((c) => c.c.postId === p.id).map((c) => ({ id: c.c.id, body: c.c.body, name: c.name, createdAt: c.c.createdAt, mine: c.c.authorId === userId })),
    })),
    can,
  };
}

export async function createPost(userId: string, input: { cohortId: string; classId: string | null; kind: PostKind; body: string }): Promise<R> {
  const kinds = await allowedKinds(userId, input.cohortId, input.classId);
  if (!kinds.includes(input.kind)) return no(kinds.length ? "Only the komti, SiPen or lecturer can post this." : "You are not in this class group.");
  await db.insert(s.posts).values({ cohortId: input.cohortId, classId: input.classId, authorId: userId, kind: input.kind, body: input.body.trim() });
  const audience = await audienceOf(input.cohortId, input.classId);
  publish({ type: "stream", message: "", tone: "info", userIds: audience });
  if (input.kind !== "discussion") {
    const [me] = await db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, userId));
    const [k] = input.classId ? await db.select({ name: s.classes.name }).from(s.classes).where(eq(s.classes.id, input.classId)) : [];
    const snippet = input.body.trim().slice(0, 120);
    await notifyUsers(audience.filter((id) => id !== userId), "announce", (t) => ({
      title: `${input.kind === "announcement" ? t.stream.kinds.announcement : t.stream.kinds.info} · ${k?.name ?? me.name}`, body: snippet, url: "/stream",
    }));
  }
  return { ok: true };
}

async function audienceOf(cohortId: string, classId: string | null) {
  const members = classId
    ? await db.select({ id: s.enrollments.userId }).from(s.enrollments).where(eq(s.enrollments.classId, classId))
    : await db.select({ id: s.cohortMembers.userId }).from(s.cohortMembers).where(eq(s.cohortMembers.cohortId, cohortId));
  const lecturers = await db.select({ id: s.classes.lecturerId }).from(s.classes).where(classId ? eq(s.classes.id, classId) : eq(s.classes.cohortId, cohortId));
  const asdos = await db.select({ id: s.courseAssistants.userId }).from(s.courseAssistants).innerJoin(s.classes, eq(s.classes.id, s.courseAssistants.classId))
    .where(classId ? eq(s.classes.id, classId) : eq(s.classes.cohortId, cohortId));
  lecturers.push(...asdos);
  return [...new Set([...members, ...lecturers].map((r) => r.id))];
}

async function canSee(userId: string, postId: string) {
  const [p] = await db.select().from(s.posts).where(eq(s.posts.id, postId)).limit(1);
  if (!p) return null;
  const aud = await audienceOf(p.cohortId, p.classId);
  return aud.includes(userId) ? p : null;
}

export async function comment(userId: string, postId: string, body: string): Promise<R> {
  const p = await canSee(userId, postId);
  if (!p) return no("You are not in this class group.");
  await db.insert(s.postComments).values({ postId, authorId: userId, body: body.trim() });
  publish({ type: "stream", message: "", tone: "info", userIds: await audienceOf(p.cohortId, p.classId) });
  if (p.authorId !== userId) {
    const [me] = await db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, userId));
    await notifyUsers([p.authorId], "reply", (t) => ({ title: `${t.stream.replied} · ${me.name}`, body: body.trim().slice(0, 120), url: "/stream" }));
  }
  return { ok: true };
}

async function moderator(userId: string, p: typeof s.posts.$inferSelect) {
  const [c] = await db.select({ komti: s.cohorts.komtiId }).from(s.cohorts).where(eq(s.cohorts.id, p.cohortId));
  if (c?.komti === userId) return true;
  const r = p.classId ? await courseRole(p.classId, userId) : null;
  return r === "lecturer" || r === "assistant";
}

export async function pinPost(userId: string, postId: string): Promise<R> {
  const [p] = await db.select().from(s.posts).where(eq(s.posts.id, postId)).limit(1);
  if (!p || !(await moderator(userId, p))) return no("Komti or lecturer only");
  await db.update(s.posts).set({ pinned: !p.pinned }).where(eq(s.posts.id, postId));
  publish({ type: "stream", message: "", tone: "info", userIds: await audienceOf(p.cohortId, p.classId) });
  return { ok: true };
}

export async function deletePost(userId: string, postId: string): Promise<R> {
  const [p] = await db.select().from(s.posts).where(eq(s.posts.id, postId)).limit(1);
  if (!p || (p.authorId !== userId && !(await moderator(userId, p)))) return no("Komti or lecturer only");
  await db.delete(s.posts).where(eq(s.posts.id, postId));
  publish({ type: "stream", message: "", tone: "info", userIds: await audienceOf(p.cohortId, p.classId) });
  return { ok: true };
}
