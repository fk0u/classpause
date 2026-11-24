import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, desc, eq, gte, inArray, lt, sql, count } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { startOfLocalDay } from "./time";

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
  return {
    sessions: sessions.map((x) => ({
      ...x,
      klass: catalog.classes[x.classId],
      room: catalog.rooms[x.roomId],
      module: catalog.modules[x.classId] ?? null,
      receipt: receipts.find((r) => r.sessionId === x.id) ?? null,
      permission: perms.find((p) => p.sessionId === x.id) ?? null,
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
  return {
    sessions: sessions.map((x) => ({
      ...x, klass: catalog.classes[x.classId], room: catalog.rooms[x.roomId],
      receipts: receiptCounts.find((r) => r.sessionId === x.id)?.n ?? 0,
    })),
    permissions: perms.map((r) => ({ ...r.p, name: r.name, studentNo: r.studentNo, className: catalog.classes[sessions.find((x) => x.id === r.p.sessionId)!.classId]?.name })),
    feed,
  };
}

export async function getLecturerView(userId: string) {
  const catalog = await getCatalog();
  const classIds = Object.values(catalog.classes).filter((c) => c.lecturerId === userId).map((c) => c.id);
  const sessions = await getTodaySessions(classIds);
  return sessions.map((x) => ({ ...x, klass: catalog.classes[x.classId], room: catalog.rooms[x.roomId] }));
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
