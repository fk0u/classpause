import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { env } from "./env";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";

const COOKIE = "cp_session";
const key = new TextEncoder().encode(env.SESSION_SECRET);

export async function signIn(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: env.APP_URL.startsWith("https"), path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

/** Current user, deduplicated per request with React cache(). */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    return u ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(roles?: User["role"][]) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (roles && !roles.includes(u.role)) redirect("/");
  return u;
}

export const homeFor = (role: User["role"]) => (role === "lecturer" ? "/lecturer" : role === "komti" ? "/komti" : "/student");
