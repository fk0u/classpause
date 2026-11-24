import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { env } from "./env";
import { DICTS, fmt, isLocale, type Dict } from "./i18n/dict";
import { publish } from "./bus";

export const pushConfigured = Boolean(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
if (pushConfigured) webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);

type Msg = { title: string; body: string; url: string };

/**
 * Notify users in their own language: stores an inbox row, then sends Web Push to
 * every subscribed device. Dead subscriptions (404/410) are pruned.
 */
export async function notifyUsers(userIds: string[], kind: string, build: (t: Dict) => Msg) {
  const ids = [...new Set(userIds)];
  if (!ids.length) return;
  const users = await db.select({ id: s.users.id, locale: s.users.locale }).from(s.users).where(inArray(s.users.id, ids));
  const msgs = new Map(users.map((u) => [u.id, build(DICTS[isLocale(u.locale) ? u.locale : "en"])]));

  await db.insert(s.notifications).values(users.map((u) => ({ userId: u.id, kind, ...msgs.get(u.id)! })));
  publish({ type: "inbox", message: "", tone: "info", userIds: ids });

  if (!pushConfigured) return;
  const subs = await db.select().from(s.pushSubscriptions).where(inArray(s.pushSubscriptions.userId, ids));
  await Promise.all(subs.map(async (sub) => {
    const m = msgs.get(sub.userId)!;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...m, tag: kind }),
        { TTL: 60 * 60, urgency: "high" },
      );
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.delete(s.pushSubscriptions).where(eq(s.pushSubscriptions.id, sub.id));
      else console.error("[push]", code ?? e);
    }
  }));
}

export async function rosterOf(classId: string) {
  return (await db.select({ id: s.enrollments.userId }).from(s.enrollments).where(eq(s.enrollments.classId, classId))).map((r) => r.id);
}

export { fmt };
