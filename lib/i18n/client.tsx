"use client";

import { createContext, useContext } from "react";
import { DICTS, type Dict, type Locale } from "./dict";

const Ctx = createContext<Dict>(DICTS.en);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={DICTS[locale]}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
/** Translate a server message when this language has a mapping for it. */
export const tr = (t: Dict, msg: string) => t.errors[msg] ?? msg;
export { fmt } from "./dict";
