import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  CRON_SECRET: z.string().min(16).optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@classpause.test"),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
});

export const env = schema.parse(process.env);
