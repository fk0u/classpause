"use client";

import { createContext, useContext } from "react";
import { DICTS, type Dict, type Locale } from "./dict";

const Ctx = createContext<Dict>(DICTS.en);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={DICTS[locale]}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
export { fmt } from "./dict";
