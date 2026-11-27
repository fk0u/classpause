/**
 * Puts the synthetic demo campus into a class group so the stream, SiPen and invite
 * features have something to show. Idempotent: safe to run after every seed or deploy.
 */
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, inArray, isNull, like } from "drizzle-orm";
import * as s from "./schema";

export const DEMO_CODE = "DEMO24";

export async function ensureDemoCohort(db: PostgresJsDatabase<typeof s>) {
  await db.update(s.users).set({ isDemo: true }).where(like(s.users.email, "%@campus.test"));
  const [existing] = await db.select().from(s.cohorts).where(eq(s.cohorts.inviteCode, DEMO_CODE));
  if (existing) return existing.id;

  const people = await db.select().from(s.users).where(like(s.users.email, "%@campus.test"));
  const komti = people.find((p) => p.email === "s002@campus.test");
  const raka = people.find((p) => p.email === "s001@campus.test");
  if (!komti || !raka) return null;
  const students = people.filter((p) => p.role !== "lecturer");

  const [cohort] = await db.insert(s.cohorts).values({ name: "Informatika 2024 · A", program: "S1 Informatika", inviteCode: DEMO_CODE, komtiId: komti.id }).returning();
  await db.insert(s.cohortMembers).values(students.map((p) => ({ cohortId: cohort.id, userId: p.id }))).onConflictDoNothing();
  const classes = await db.select().from(s.classes).where(and(isNull(s.classes.cohortId), like(s.classes.code, "%-A")));
  if (classes.length) await db.update(s.classes).set({ cohortId: cohort.id }).where(inArray(s.classes.id, classes.map((c) => c.id)));
  const dsl = classes.find((c) => c.code === "IF2101-A");
  if (dsl) await db.update(s.classes).set({ sipenId: raka.id }).where(eq(s.classes.id, dsl.id));

  const lec = people.find((p) => p.email === "naufal@campus.test");
  const ago = (h: number) => new Date(Date.now() - h * 3600_000);
  await db.insert(s.posts).values([
    { cohortId: cohort.id, authorId: komti.id, kind: "announcement", pinned: true, createdAt: ago(20),
      body: "Selamat datang di stream kelas! Pengumuman resmi dari komti, SiPen dan dosen muncul di sini. Aktifkan notifikasi di Profil supaya tidak ketinggalan." },
    ...(dsl && lec ? [{ cohortId: cohort.id, classId: dsl.id, authorId: lec.id, kind: "info" as const, createdAt: ago(6),
      body: "Materi minggu ini: K-map 4 variabel. Bawa kalkulator, ada latihan di kelas." }] : []),
    ...(dsl ? [{ cohortId: cohort.id, classId: dsl.id, authorId: raka.id, kind: "announcement" as const, createdAt: ago(3),
      body: "Tugas 3 Sistem Digital dikumpulkan lewat ketua kelompok paling lambat Jumat 23.59." }] : []),
    { cohortId: cohort.id, authorId: students[5]?.id ?? komti.id, kind: "discussion", createdAt: ago(1),
      body: "Ada yang mau belajar bareng Struktur Data sore ini? Lab-302 kosong jam 16.40." },
  ]);
  return cohort.id;
}

if (process.argv[1]?.endsWith("demo-cohort.ts")) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  ensureDemoCohort(drizzle(sql, { schema: s }))
    .then((id) => console.log(id ? `demo cohort ${id}` : "no demo users"))
    .finally(() => sql.end());
}
