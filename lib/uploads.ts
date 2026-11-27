import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

/** Uploaded proof letters and class photos. Stored outside git, served only through /files with an access check. */
export const uploadRoot = path.resolve(env.UPLOAD_DIR);

const TYPES: Record<string, string> = {
  "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic",
};
export const MIME_OF: Record<string, string> = Object.fromEntries(Object.entries(TYPES).map(([m, e]) => [e, m]));

export type UploadKind = "proofs" | "photos";
const LIMITS: Record<UploadKind, { max: number; types: string[] }> = {
  proofs: { max: 5 * 1024 * 1024, types: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"] },
  photos: { max: 8 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/heic"] },
};

/** Checks the real file signature, not just the browser's claimed type. */
function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString().startsWith("ftypheic") || buf.subarray(4, 12).toString().startsWith("ftypmif1")) return "image/heic";
  return null;
}

export async function saveUpload(kind: UploadKind, file: unknown) {
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose a file first." };
  const lim = LIMITS[kind];
  if (file.size > lim.max) return { ok: false as const, error: `File too large (max ${lim.max / 1024 / 1024} MB).` };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !lim.types.includes(type)) return { ok: false as const, error: kind === "proofs" ? "Upload a PDF or a photo (JPG, PNG, WebP, HEIC)." : "Upload a photo (JPG, PNG, WebP, HEIC)." };
  const name = `${Date.now().toString(36)}-${randomBytes(9).toString("base64url")}.${TYPES[type]}`;
  await mkdir(path.join(uploadRoot, kind), { recursive: true });
  await writeFile(path.join(uploadRoot, kind, name), buf, { mode: 0o600 });
  return { ok: true as const, path: `${kind}/${name}`, original: file.name.slice(0, 120) };
}

/** Only our own generated names are valid: kind/<base36>-<base64url>.<ext>. */
export function resolveUpload(p: string) {
  const m = /^(proofs|photos)\/([a-z0-9]+-[A-Za-z0-9_-]{12}\.(pdf|jpg|png|webp|heic))$/.exec(p);
  return m ? { kind: m[1] as UploadKind, file: path.join(uploadRoot, m[1], m[2]), ext: m[3] } : null;
}
