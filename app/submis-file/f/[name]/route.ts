import { createReadStream, createWriteStream } from "node:fs";
import { stat, unlink, rename, mkdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { hasAccess, safePath, submisDir, MIME, extOf } from "@/lib/submis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD = 500 * 1024 * 1024;
const deny = () => new Response("Not found", { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await hasAccess())) return new Response("Locked", { status: 401 });
  const name = decodeURIComponent((await params).name);
  const p = safePath(name);
  if (!p) return deny();
  const st = await stat(p).catch(() => null);
  if (!st?.isFile()) return deny();
  const download = new URL(req.url).searchParams.has("download");
  return new Response(Readable.toWeb(createReadStream(p)) as ReadableStream, {
    headers: {
      "content-type": MIME[extOf(name)] ?? "application/octet-stream",
      "content-length": String(st.size),
      "content-disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}

/** Streams an upload straight to disk (no buffering in memory), then renames into place. */
export async function PUT(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await hasAccess())) return new Response("Locked", { status: 401 });
  const name = decodeURIComponent((await params).name);
  const p = safePath(name);
  if (!p) return new Response("Bad file name", { status: 400 });
  if (!MIME[extOf(name)]) return new Response("File type not allowed", { status: 415 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (!req.body || len > MAX_UPLOAD) return new Response("Too large (max 500 MB)", { status: 413 });
  await mkdir(submisDir, { recursive: true });
  const tmp = `${p}.part`;
  let seen = 0;
  const limited = Readable.fromWeb(req.body as import("node:stream/web").ReadableStream).on("data", (c: Buffer) => {
    seen += c.length;
    if (seen > MAX_UPLOAD) limited.destroy(new Error("too large"));
  });
  try {
    await pipeline(limited, createWriteStream(tmp));
    await rename(tmp, p);
  } catch {
    await unlink(tmp).catch(() => {});
    return new Response("Upload failed", { status: 400 });
  }
  return Response.json({ ok: true, name });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await hasAccess())) return new Response("Locked", { status: 401 });
  const p = safePath(decodeURIComponent((await params).name));
  if (!p) return deny();
  await unlink(p).catch(() => {});
  return Response.json({ ok: true });
}
