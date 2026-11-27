import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { and, eq, or } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { resolveUpload, MIME_OF } from "@/lib/uploads";
import { db, schema as s } from "@/db";
import { teacherIds } from "@/lib/teach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who may see a file: proofs → the student, the class lecturer and komti; photos → anyone in the class or its lecturer. */
async function teachesClassOfProof(path: string, userId: string) {
  const [r] = await db.select({ classId: s.sessions.classId }).from(s.permissions).innerJoin(s.sessions, eq(s.sessions.id, s.permissions.sessionId)).where(eq(s.permissions.proofPath, path)).limit(1);
  return r ? (await teacherIds(r.classId)).includes(userId) : false;
}

async function allowed(userId: string, path: string) {
  const perm = (await db.select({ owner: s.permissions.userId, lecturer: s.classes.lecturerId, komti: s.classes.komtiId })
    .from(s.permissions).innerJoin(s.sessions, eq(s.sessions.id, s.permissions.sessionId)).innerJoin(s.classes, eq(s.classes.id, s.sessions.classId))
    .where(eq(s.permissions.proofPath, path)).limit(1))[0];
  if (perm) return [perm.owner, perm.komti].includes(userId) || (await teachesClassOfProof(path, userId));
  const ses = (await db.select({ classId: s.sessions.classId, lecturer: s.classes.lecturerId }).from(s.sessions)
    .innerJoin(s.classes, eq(s.classes.id, s.sessions.classId)).where(eq(s.sessions.photoPath, path)).limit(1))[0];
  if (!ses) return false;
  if ((await teacherIds(ses.classId)).includes(userId)) return true;
  return (await db.select({ u: s.enrollments.userId }).from(s.enrollments)
    .where(and(eq(s.enrollments.classId, ses.classId), or(eq(s.enrollments.userId, userId)))).limit(1)).length > 0;
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; name: string }> }) {
  const u = await currentUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const { kind, name } = await params;
  const rel = `${kind}/${name}`;
  const f = resolveUpload(rel);
  if (!f || !(await allowed(u.id, rel))) return new Response("Not found", { status: 404 });
  const st = await stat(f.file).catch(() => null);
  if (!st?.isFile()) return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(createReadStream(f.file)) as ReadableStream, {
    headers: { "content-type": MIME_OF[f.ext], "content-length": String(st.size), "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff", "content-disposition": "inline" },
  });
}
