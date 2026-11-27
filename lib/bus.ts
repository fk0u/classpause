import { EventEmitter } from "node:events";

/**
 * In-process realtime bus feeding the SSE stream.
 * ClassPause runs as a single Node process (pm2 fork mode); to scale out,
 * swap this for Postgres LISTEN/NOTIFY or Redis pub/sub behind the same API.
 */
export type LiveEvent = {
  type: "session" | "permission" | "receipt" | "prompt" | "inbox" | "room";
  /** When set, only these users receive the event. */
  userIds?: string[];
  /** i18n key into dict.notif so each client can show the toast in its own language. */
  kind?: string;
  vars?: Record<string, string>;
  sessionId?: string;
  classId?: string;
  message: string;
  tone: "ok" | "warn" | "info";
  at: string;
};

const g = globalThis as unknown as { __bus?: EventEmitter };
export const bus = g.__bus ?? (g.__bus = new EventEmitter().setMaxListeners(1000));

export function publish(e: Omit<LiveEvent, "at">) {
  bus.emit("live", { ...e, at: new Date().toISOString() } satisfies LiveEvent);
}
