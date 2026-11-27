import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { BLOCKS, BLOCK_LEN } from "./slot-engine";
import { atLocal, localParts, startOfLocalDay } from "./time";
import { publish } from "./bus";

const FREED = new Set(["micropause", "rescheduled"]);
const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

export type OpenSlot = {
  key: string; roomId: string; roomCode: string; building: string; capacity: number;
  startsAt: string; endsAt: string; freedFrom: string | null;
  claim: { id: string; purpose: string; by: string; mine: boolean } | null;
};

/**
 * Room slots still ahead today that nobody teaches in. A slot whose class was cancelled
 * (Micro-Pause or moved) shows as "freed" — the blueprint's pop-up study space.
 */
export async function getOpenRooms(userId: string, now = new Date()): Promise<OpenSlot[]> {
  const p = localParts(now);
  const dayStart = startOfLocalDay(now);
  const dayEnd = new Date(+dayStart + 86_400_000);
  const [rooms, meetings, sessions, claims, classes] = await Promise.all([
    db.select().from(s.rooms),
    db.select().from(s.meetings).where(eq(s.meetings.day, p.day)),
    db.select().from(s.sessions).where(and(gte(s.sessions.startsAt, dayStart), lt(s.sessions.startsAt, dayEnd))),
    db.select({ c: s.roomClaims, name: s.users.name }).from(s.roomClaims).innerJoin(s.users, eq(s.users.id, s.roomClaims.userId))
      .where(and(gte(s.roomClaims.startsAt, dayStart), lt(s.roomClaims.startsAt, dayEnd))),
    db.select({ id: s.classes.id, name: s.classes.name }).from(s.classes),
  ]);
  const className = new Map(classes.map((c) => [c.id, c.name]));
  // Rooms borrowed today by classes moved into them.
  const moved = (await db.select({ slot: s.sessions.lockedSlot }).from(s.sessions).where(eq(s.sessions.status, "rescheduled")))
    .map((r) => r.slot).filter((x) => x?.roomId && x.startsAt && new Date(x.startsAt) >= dayStart && new Date(x.startsAt) < dayEnd);

  const out: OpenSlot[] = [];
  for (const start of BLOCKS) {
    const end = start + BLOCK_LEN;
    if (end <= p.minutes) continue; // already over
    const startsAt = atLocal(p.y, p.m, p.d, start), endsAt = atLocal(p.y, p.m, p.d, end);
    for (const room of rooms) {
      const busy = meetings.filter((m) => m.roomId === room.id && overlaps(start, end, m.startMin, m.endMin));
      let freedFrom: string | null = null;
      let occupied = false;
      for (const m of busy) {
        const ses = sessions.find((x) => x.classId === m.classId && x.roomId === room.id);
        if (ses && FREED.has(ses.status)) freedFrom = className.get(m.classId) ?? null; else occupied = true;
      }
      if (moved.some((x) => x!.roomId === room.id && overlaps(+startsAt, +endsAt, +new Date(x!.startsAt!), +new Date(x!.endsAt!)))) occupied = true;
      if (occupied) continue;
      const c = claims.find((x) => x.c.roomId === room.id && +x.c.startsAt === +startsAt);
      out.push({
        key: `${room.id}|${startsAt.toISOString()}`, roomId: room.id, roomCode: room.code, building: room.building, capacity: room.capacity,
        startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), freedFrom,
        claim: c ? { id: c.c.id, purpose: c.c.purpose, by: c.name, mine: c.c.userId === userId } : null,
      });
    }
  }
  // Freed rooms first (they are the surprise ones), then by time.
  return out.sort((a, b) => Number(!!b.freedFrom) - Number(!!a.freedFrom) || a.startsAt.localeCompare(b.startsAt) || a.roomCode.localeCompare(b.roomCode));
}

export async function claimRoom(userId: string, roomId: string, startsAtIso: string, purpose: string) {
  const open = await getOpenRooms(userId);
  const slot = open.find((o) => o.roomId === roomId && o.startsAt === startsAtIso);
  if (!slot) return { ok: false as const, error: "That room isn’t free at that time any more." };
  if (slot.claim) return { ok: false as const, error: "Someone already claimed it." };
  const mineToday = (await db.select({ n: sql<number>`count(*)::int` }).from(s.roomClaims)
    .where(and(eq(s.roomClaims.userId, userId), gte(s.roomClaims.startsAt, startOfLocalDay(new Date())))))[0]?.n ?? 0;
  if (mineToday >= 2) return { ok: false as const, error: "Two room claims per day, so everyone gets a turn." };
  const ins = await db.insert(s.roomClaims).values({ roomId, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), userId, purpose })
    .onConflictDoNothing().returning();
  if (!ins.length) return { ok: false as const, error: "Someone already claimed it." };
  publish({ type: "room", message: `${slot.roomCode} claimed`, tone: "info" });
  return { ok: true as const };
}

export async function releaseRoom(userId: string, claimId: string) {
  await db.delete(s.roomClaims).where(and(eq(s.roomClaims.id, claimId), eq(s.roomClaims.userId, userId)));
  publish({ type: "room", message: "Room released", tone: "info" });
}

const REPORT_TTL_MS = 3 * 60 * 60_000;

export async function getReports() {
  return db.select().from(s.facilityReports)
    .where(and(isNull(s.facilityReports.resolvedAt), gte(s.facilityReports.createdAt, new Date(Date.now() - REPORT_TTL_MS))))
    .orderBy(desc(s.facilityReports.confirms), desc(s.facilityReports.createdAt)).limit(30);
}

/** Same place + kind within the TTL counts as "me too" instead of a duplicate. */
export async function report(userId: string, place: string, kind: (typeof s.facilityKindEnum.enumValues)[number]) {
  const [open] = await db.select().from(s.facilityReports).where(and(
    eq(s.facilityReports.place, place), eq(s.facilityReports.kind, kind), isNull(s.facilityReports.resolvedAt),
    gte(s.facilityReports.createdAt, new Date(Date.now() - REPORT_TTL_MS)))).limit(1);
  if (open) await db.update(s.facilityReports).set({ confirms: sql`${s.facilityReports.confirms} + 1` }).where(eq(s.facilityReports.id, open.id));
  else await db.insert(s.facilityReports).values({ place, kind, userId });
  publish({ type: "room", message: "Facility report", tone: "info" });
}

export async function resolveReport(id: string) {
  await db.update(s.facilityReports).set({ resolvedAt: new Date() }).where(eq(s.facilityReports.id, id));
  publish({ type: "room", message: "Report resolved", tone: "ok" });
}
