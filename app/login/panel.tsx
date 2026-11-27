"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { loginAction } from "../account-actions";
import { Field, Submit, FormError } from "@/components/form-bits";
import PersonaPicker from "./picker";
import { useT, tr } from "@/lib/i18n/client";

type Persona = { id: string; name: string; role: "student" | "komti" | "lecturer"; studentNo: string | null };

/** Email + password by default. The demo personas open with ?demo, the "Try the demo" link, or 5 taps on the flower. */
export default function LoginPanel({ personas, demo: initial }: { personas: Persona[]; demo: boolean }) {
  const t = useT();
  const [demo, setDemo] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {demo ? (
        <motion.div key="demo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-ink/60"><Sparkles size={15} className="text-violet" /> {t.auth.demoLead}</p>
          <PersonaPicker personas={personas} />
          <button onClick={() => setDemo(false)} className="mt-4 w-full text-center text-sm font-semibold text-violet">{t.auth.back}</button>
        </motion.div>
      ) : (
        <motion.form key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            start(async () => {
              const r = await loginAction({ email: f.get("email"), password: f.get("password") });
              if (r && !r.ok) setError(tr(t, r.error));
            });
          }}>
          <h2 className="font-display text-2xl font-extrabold">{t.auth.welcome}</h2>
          <p className="text-sm text-ink/60">{t.auth.welcomeLead}</p>
          <Field label={t.auth.email} name="email" type="email" autoComplete="email" required onChange={() => setError(null)} />
          <Field label={t.auth.password} name="password" type="password" autoComplete="current-password" required onChange={() => setError(null)} />
          <FormError msg={error} />
          <Submit busy={busy}>{t.auth.signIn}</Submit>
          <p className="text-center text-sm text-ink/60">{t.auth.noAccount} <Link href="/register" className="font-semibold text-violet">{t.auth.signUp}</Link></p>
          <button type="button" onClick={() => setDemo(true)} className="w-full rounded-full border-2 border-dashed border-ink/15 py-2.5 text-sm font-semibold text-ink/60 hover:border-violet hover:text-violet">{t.auth.demo}</button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
