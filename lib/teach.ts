import { eq, or, sql, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** WHERE fragment: the user teaches this course, as its lecturer or an asisten dosen. Use on queries that join `classes`. */
export const teaches = (userId: string): SQL =>
  or(eq(s.classes.lecturerId, userId), sql`exists (select 1 from ${s.courseAssistants} ca where ca.class_id = ${s.classes.id} and ca.user_id = ${userId})`)!;

/** Lecturer plus asdos of a course: everyone who gets lecturer notifications for it. */
export async function teacherIds(classId: string) {
  const [k] = await db.select({ id: s.classes.lecturerId }).from(s.classes).where(eq(s.classes.id, classId)).limit(1);
  const a = await db.select({ id: s.courseAssistants.userId }).from(s.courseAssistants).where(eq(s.courseAssistants.classId, classId));
  return [...new Set([...(k ? [k.id] : []), ...a.map((r) => r.id)])];
}
