"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { grantAccess, passwordMatches } from "@/lib/submis";
import { rateLimit } from "@/lib/rate-limit";

export async function unlockSubmis(_: unknown, form: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`submis:${ip}`, 8, 10 * 60_000)) return { error: "Too many attempts. Try again in 10 minutes." };
  const pw = z.string().min(1).max(200).safeParse(form.get("password"));
  if (!pw.success || !passwordMatches(pw.data)) return { error: "Wrong password." };
  await grantAccess();
  return { error: null };
}
