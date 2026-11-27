/**
 * Seeds a SYNTHETIC East Kalimantan campus dataset. No real student data.
 * Idempotent: wipes ClassPause tables first.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as s from "./schema";
import { MODULES } from "./modules";
import { ensureDemoCohort } from "./demo-cohort";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
const db = drizzle(sql, { schema: s });

let seed = 20261216;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

const FIRST = ["Raka", "Nadia", "Fajar", "Salsa", "Dimas", "Putri", "Bayu", "Aulia", "Rizky", "Intan", "Yoga", "Citra", "Hendra", "Maya", "Arif", "Dewi", "Galih", "Nisa", "Teguh", "Laras"];
const LAST = ["Pratama", "Saputri", "Ramadhan", "Lestari", "Wibowo", "Anggraini", "Setiawan", "Kurniawan", "Hidayat", "Permata"];

// 100-minute blocks used by the campus timetable.
export const BLOCKS = [450, 560, 670, 780, 890, 1000]; // 07:30 09:20 11:10 13:00 14:50 16:40
const LEN = 100;

async function main() {
  await sql`truncate events, permissions, attendance_receipts, micro_modules, sessions, meetings, enrollments, classes, rooms, users restart identity cascade`;

  const lecturers = await db.insert(s.users).values([
    { name: "Dr. Naufal Hakim", email: "naufal@campus.test", role: "lecturer" },
    { name: "Dr. Sari Wulandari", email: "sari@campus.test", role: "lecturer" },
    { name: "Ir. Budi Santoso, M.T.", email: "budi@campus.test", role: "lecturer" },
  ]).returning();

  const studentRows = Array.from({ length: 40 }, (_, i) => {
    const name = i === 0 ? "Raka Pratama" : i === 1 ? "Salsa Lestari" : `${pick(FIRST)} ${pick(LAST)}`;
    return {
      name, email: `s${String(i + 1).padStart(3, "0")}@campus.test`,
      role: (i === 1 ? "komti" : "student") as "komti" | "student",
      studentNo: `2611${String(102400 + i).padStart(6, "0")}`,
    };
  });
  const students = await db.insert(s.users).values(studentRows).returning();
  const komti = students[1];

  const rooms = await db.insert(s.rooms).values([
    { code: "A-102", building: "Gedung A", capacity: 45 },
    { code: "B-105", building: "Gedung B", capacity: 50 },
    { code: "B-204", building: "Gedung B", capacity: 40 },
    { code: "Lab-301", building: "Gedung C", capacity: 42 },
    { code: "Lab-302", building: "Gedung C", capacity: 30 },
    { code: "Aula-1", building: "Rektorat", capacity: 120 },
  ]).returning();
  const room = (c: string) => rooms.find((r) => r.code === c)!;

  const classDefs = [
    { code: "IF2101-A", name: "Digital Systems & Logic", lec: 0, all: true },
    { code: "IF2102-A", name: "Algorithms & Data Structures", lec: 1, all: true },
    { code: "IF2103-A", name: "Discrete Mathematics", lec: 2, all: true },
    { code: "IF2104-A", name: "Database Systems", lec: 1, all: false },
    { code: "IF2105-A", name: "Computer Networks", lec: 2, all: false },
    { code: "UM1001-A", name: "Pancasila & Civics", lec: 0, all: false },
  ];
  const classes = await db.insert(s.classes).values(classDefs.map((c) => ({
    code: c.code, name: c.name, section: "A", lecturerId: lecturers[c.lec].id, komtiId: komti.id,
  }))).returning();

  // Enrollment: core classes take all 40; electives take a random ~60%.
  const enr: { classId: string; userId: string }[] = [];
  classes.forEach((c, i) => students.forEach((st, j) => {
    if (classDefs[i].all || j < 2 || rand() < 0.6) enr.push({ classId: c.id, userId: st.id });
  }));
  await db.insert(s.enrollments).values(enr);

  // Weekly timetable (Mon–Fri). Each class meets twice; one slot per day keeps it realistic.
  const plan: [number, number, number, string][] = [
    // class, day, block, room
    [0, 1, 1, "A-102"], [0, 3, 1, "A-102"],
    [1, 1, 0, "B-204"], [1, 4, 2, "B-204"],
    [2, 2, 1, "B-105"], [2, 5, 0, "B-105"],
    [3, 2, 3, "Lab-302"], [3, 4, 4, "Lab-302"],
    [4, 3, 3, "Lab-301"], [4, 5, 2, "Lab-301"],
    [5, 1, 4, "Aula-1"], [5, 4, 0, "Aula-1"],
  ];
  // Every weekday also gets one DSL "lab" so the demo class runs every day.
  for (const d of [2, 4, 5]) plan.push([0, d, 5, "A-102"]);
  await db.insert(s.meetings).values(plan.map(([c, day, b, r]) => ({
    classId: classes[c].id, roomId: room(r).id, day, startMin: BLOCKS[b], endMin: BLOCKS[b] + LEN,
  })));

  await db.insert(s.microModules).values(classes.filter((c) => MODULES[c.code]).map((c) => ({ classId: c.id, ...MODULES[c.code] })));

  await ensureDemoCohort(db);
  console.log(`seeded: ${lecturers.length} lecturers, ${students.length} students, ${classes.length} classes, ${plan.length} meetings`);
  await sql.end();
}

main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
