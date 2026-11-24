"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/app/actions";
import { useT } from "@/lib/i18n/client";
import { DICTS, LOCALES } from "@/lib/i18n/dict";

/** Segmented EN / ID switch. Saves to the profile (when signed in) and a cookie. */
export default function LangSwitch({ dark = false }: { dark?: boolean }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full p-1 ${dark ? "bg-white/10" : "bg-paper"} ${pending ? "opacity-60" : ""}`} role="radiogroup" aria-label={t.profile.language}>
      <Languages size={15} className={`mx-1.5 ${dark ? "text-white/60" : "text-slate-500"}`} />
      {LOCALES.map((l) => {
        const on = t.locale === l;
        return (
          <button key={l} role="radio" aria-checked={on} title={DICTS[l].langName}
            onClick={() => start(async () => { await setLocaleAction(l); router.refresh(); })}
            className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition ${on ? "bg-ink text-white" : dark ? "text-white/70" : "text-slate-600"}`}>
            {l}
          </button>
        );
      })}
    </div>
  );
}
