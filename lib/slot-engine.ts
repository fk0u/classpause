import { and, eq, inArray, ne, gte, isNotNull } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { SlotProposal } from "@/db/schema";
import { atLocal, localParts } from "./time";

export const BLOCKS = [450, 560, 670, 780, 890, 1000]; // 07:30 … 16:40 WITA
export const BLOCK_LEN = 100;
const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/**
 * Conflict-free slot engine.
 * Hard constraints: lecturer free, a room with enough seats free.
 * Soft constraint (scored): number of enrolled students with another class at that time.
 * Searches the next 6 campus days (Mon–Sat) over the standard 100-minute blocks.
 */
export async function proposeSlots(sessionId: string, now = new Date()): Promise<SlotProposal[]> {
  const [session] = await db.select().from(s.sessions).where(eq(s.sessions.id, sessionId)).limit(1);
  if (!session) throw new Error("Session not found");
  const [klass] = await db.select().from(s.classes).where(eq(s.classes.id, session.classId)).limit(1);

  const roster = await db.select({ userId: s.enrollments.userId }).from(s.enrollments).where(eq(s.enrollments.classId, klass.id));
  const studentIds = roster.map((r) => r.userId);
  const enrolled = studentIds.length;

  // Every other class any of these students (or the lecturer) attends.
  const otherEnr = studentIds.length
    ? await db.select({ classId: s.enrollments.classId, userId: s.enrollments.userId }).from(s.enrollments)
        .where(and(inArray(s.enrollments.userId, studentIds), ne(s.enrollments.classId, klass.id)))
    : [];
  const lecturerClasses = await db.select({ id: s.classes.id }).from(s.classes)
    .where(and(eq(s.classes.lecturerId, klass.lecturerId), ne(s.classes.id, klass.id)));

  const allMeetings = await db.select().from(s.meetings);
  const rooms = (await db.select().from(s.rooms)).filter((r) => r.capacity >= enrolled).sort((a, b) => a.capacity - b.capacity);

  // Rooms already taken by one-off rescheduled sessions.
  const locked = await db.select({ slot: s.sessions.lockedSlot }).from(s.sessions)
    .where(and(isNotNull(s.sessions.lockedSlot), gte(s.sessions.startsAt, new Date(now.getTime() - 86_400_000))));

  const studentsByClass = new Map<string, string[]>();
  for (const e of otherEnr) (studentsByClass.get(e.classId) ?? studentsByClass.set(e.classId, []).get(e.classId)!).push(e.userId);
  const lecturerSet = new Set(lecturerClasses.map((c) => c.id));

  const candidates: SlotProposal[] = [];
  const today = localParts(now);
  for (let offset = 1; offset <= 7; offset++) {
    const date = new Date(Date.UTC(today.y, today.m, today.d + offset));
    const dow = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    if (dow === 7) continue;
    for (const start of BLOCKS) {
      const end = start + BLOCK_LEN;
      const sameTime = allMeetings.filter((m) => m.day === dow && overlaps(start, end, m.startMin, m.endMin));
      if (sameTime.some((m) => lecturerSet.has(m.classId))) continue;

      const startsAt = atLocal(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), start);
      const endsAt = new Date(startsAt.getTime() + BLOCK_LEN * 60_000);
      const busyRooms = new Set(sameTime.map((m) => m.roomId));
      for (const l of locked) {
        if (l.slot?.roomId && l.slot.startsAt && l.slot.endsAt &&
          overlaps(+startsAt, +endsAt, +new Date(l.slot.startsAt), +new Date(l.slot.endsAt))) busyRooms.add(l.slot.roomId);
      }
      const room = rooms.find((r) => !busyRooms.has(r.id));
      if (!room) continue;

      const conflicted = new Set<string>();
      for (const m of sameTime) for (const u of studentsByClass.get(m.classId) ?? []) conflicted.add(u);

      candidates.push({
        id: `${startsAt.toISOString()}|${room.code}`, kind: "alt",
        startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(),
        roomId: room.id, roomCode: room.code, conflicts: conflicted.size, enrolled,
      });
    }
  }

  candidates.sort((a, b) => a.conflicts - b.conflicts || +new Date(a.startsAt!) - +new Date(b.startsAt!));
  const best = candidates[0];
  const bestDay = best && localParts(new Date(best.startsAt!)).d;
  const alt = candidates.find((c) => c !== best && localParts(new Date(c.startsAt!)).d !== bestDay) ?? candidates[1];

  const out: SlotProposal[] = [];
  if (best) out.push({ ...best, kind: "optimal" });
  if (alt) out.push({ ...alt, kind: "alt" });
  out.push({ id: "async", kind: "async", conflicts: 0, enrolled });
  return out;
}
