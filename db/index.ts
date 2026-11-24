import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env";
import * as schema from "./schema";

const g = globalThis as unknown as { __sql?: postgres.Sql };

// One pool per process; survives Next dev hot reloads.
const sql = g.__sql ?? postgres(env.DATABASE_URL, {
  max: env.DB_POOL_MAX,
  idle_timeout: 30,
  prepare: true,
  onnotice: () => {},
});
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
