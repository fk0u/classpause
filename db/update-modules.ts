/** Replaces Micro-Pause modules with db/modules.ts without touching any other data. */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as s from "./schema";
import { MODULES } from "./modules";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  const db = drizzle(sql, { schema: s });
  for (const [code, m] of Object.entries(MODULES)) {
    const [c] = await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, code));
    if (!c) continue;
    await db.delete(s.microModules).where(eq(s.microModules.classId, c.id));
    await db.insert(s.microModules).values({ classId: c.id, ...m });
    console.log(`${code}: ${m.quiz.length} questions`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
