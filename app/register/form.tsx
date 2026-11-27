"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerAction } from "../account-actions";
import { Field, Submit, FormError } from "@/components/form-bits";
import { useT, tr } from "@/lib/i18n/client";

export default function RegisterForm({ claim }: { claim: string | null }) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <form className="mt-4 space-y-3" onChange={() => setError(null)} onSubmit={(e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
      start(async () => {
        const r = await registerAction({ ...f, studentNo: f.studentNo || undefined, claim: claim ?? undefined });
        if (r && !r.ok) setError(tr(t, r.error));
      });
    }}>
      {claim && <p className="rounded-2xl bg-butter px-4 py-3 text-sm">{t.auth.claimLead} <b className="font-mono">{claim}</b></p>}
      <Field label={t.auth.name} name="name" autoComplete="name" required minLength={2} />
      <Field label={t.auth.email} name="email" type="email" autoComplete="email" required />
      {!claim && <Field label={t.auth.studentNo} hint={t.auth.optional} name="studentNo" inputMode="numeric" />}
      <Field label={t.auth.password} hint={t.auth.pwHint} name="password" type="password" autoComplete="new-password" required minLength={8} />
      <FormError msg={error} />
      <Submit busy={busy}>{t.auth.signUp}</Submit>
      <p className="text-center text-sm text-ink/60">{t.auth.haveAccount} <Link href="/login" className="font-semibold text-violet">{t.auth.signIn}</Link></p>
    </form>
  );
}
