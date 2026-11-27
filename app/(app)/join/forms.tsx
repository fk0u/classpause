"use client";

import { useState, useTransition } from "react";
import { Crown, KeyRound } from "lucide-react";
import { joinAction, createCohortAction } from "@/app/account-actions";
import { Field, Submit, FormError } from "@/components/form-bits";
import { useT, tr } from "@/lib/i18n/client";

export default function JoinForms({ code, canCreate }: { code: string; canCreate: boolean }) {
  const t = useT();
  const [err, setErr] = useState<{ join?: string; create?: string }>({});
  const [busy, start] = useTransition();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form className="space-y-3 rounded-[28px] bg-mint p-5" onSubmit={(e) => {
        e.preventDefault();
        const v = new FormData(e.currentTarget).get("code");
        start(async () => { const r = await joinAction(v); if (r && !r.ok) setErr({ join: tr(t, r.error) }); });
      }}>
        <KeyRound className="text-mint-deep" />
        <Field label={t.auth.code} name="code" defaultValue={code} required autoCapitalize="characters" autoComplete="off" maxLength={12}
          className="bg-white text-center font-mono text-2xl uppercase tracking-[0.3em]" />
        <FormError msg={err.join ?? null} />
        <Submit busy={busy} className="bg-ink hover:bg-ink">{t.auth.join}</Submit>
      </form>
      {canCreate && (
        <form className="space-y-3 rounded-[28px] bg-lilac p-5" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          start(async () => { const r = await createCohortAction({ name: f.get("name"), program: f.get("program") }); if (r && !r.ok) setErr({ create: tr(t, r.error) }); });
        }}>
          <Crown className="text-lilac-deep" />
          <p className="font-display text-xl font-bold">{t.auth.orCreate}</p>
          <p className="text-sm text-ink/60">{t.auth.createLead}</p>
          <Field label={t.auth.groupName} name="name" placeholder={t.auth.groupPh} required minLength={2} className="bg-white" />
          <Field label={t.auth.program} name="program" placeholder={t.auth.programPh} required minLength={2} className="bg-white" />
          <FormError msg={err.create ?? null} />
          <Submit busy={busy}>{t.auth.create}</Submit>
        </form>
      )}
    </div>
  );
}
