import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { env } from "./env";

/** Password-protected file manager for competition submission files. Files live outside git. */
export const SUBMIS_COOKIE = "cp_submis";
const key = new TextEncoder().encode(env.SESSION_SECRET);
export const submisDir = path.resolve(env.SUBMIS_DIR);

export const fileNameSchema = z.string().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9 ._()-]*\.[A-Za-z0-9]{1,8}$/, "Use letters, digits, spaces, . _ - ( ) and an extension");

/** Resolve a user-supplied name to a path that must stay inside the submissions folder. */
export function safePath(name: string) {
  const ok = fileNameSchema.safeParse(name);
  if (!ok.success) return null;
  const full = path.resolve(submisDir, ok.data);
  return path.dirname(full) === submisDir ? full : null;
}

const digest = (s: string) => createHash("sha256").update(s).digest();
export function passwordMatches(input: string) {
  if (!env.SUBMIS_PASSWORD) return false;
  return timingSafeEqual(digest(input), digest(env.SUBMIS_PASSWORD));
}

// The cookie is bound to a hash of the current password, so changing the password logs everyone out.
const pwTag = () => digest(env.SUBMIS_PASSWORD ?? "").toString("hex").slice(0, 16);

export async function grantAccess() {
  const token = await new SignJWT({ scope: "submis", pw: pwTag() }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(key);
  (await cookies()).set(SUBMIS_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: env.APP_URL.startsWith("https"), path: "/submis-file", maxAge: 60 * 60 * 12 });
}

export async function hasAccess() {
  const t = (await cookies()).get(SUBMIS_COOKIE)?.value;
  if (!t || !env.SUBMIS_PASSWORD) return false;
  try {
    const { payload } = await jwtVerify(t, key, { algorithms: ["HS256"] });
    return payload.scope === "submis" && payload.pw === pwTag();
  } catch { return false; }
}

export async function listFiles() {
  await mkdir(submisDir, { recursive: true });
  const names = (await readdir(submisDir)).filter((n) => fileNameSchema.safeParse(n).success);
  const rows = await Promise.all(names.map(async (name) => {
    const st = await stat(path.join(submisDir, name));
    return st.isFile() ? { name, size: st.size, modified: st.mtime.toISOString() } : null;
  }));
  return rows.filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => a.name.localeCompare(b.name));
}

export const MIME: Record<string, string> = {
  pdf: "application/pdf", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", png: "image/png",
  jpg: "image/jpeg", jpeg: "image/jpeg", zip: "application/zip", txt: "text/plain; charset=utf-8", md: "text/markdown; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
export const extOf = (n: string) => n.split(".").pop()!.toLowerCase();
