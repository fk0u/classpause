import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DICTS, isLocale, type Locale } from "./dict";
import { currentUser } from "../auth";

export const LOCALE_COOKIE = "cp_locale";

/** Signed-in user's saved locale → cookie → Accept-Language → English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const u = await currentUser().catch(() => null);
  if (u && isLocale(u.locale)) return u.locale;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^id\b|,\s*id\b/i.test(al) ? "id" : "en";
});

export const getDict = async () => DICTS[await getLocale()];
