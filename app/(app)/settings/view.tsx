"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Plus, TriangleAlert, Users } from "lucide-react";
import * as act from "@/app/account-actions";
import { Field, Submit, FormError } from "@/components/form-bits";
import { useLive } from "@/components/live";
import { useT, tr, fmt } from "@/lib/i18n/client";

type Me = { id: string; name: string; email: string; studentNo: string | null; role: "student" | "komti" | "lecturer"; isDemo: boolean };
type Group = { id: string; name: string; program: string; komtiId: string; members: number };
const card = "rounded-[28px] bg-white p-5";

export default function SettingsView({ me, groups }: { me: Me; groups: Group[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useLive();
  const [busy, start] = useTransition();
  const [err, setErr] = useState<Record<string, string | null>>({});
  const [email, setEmail] = useState(me.email);
  const run = (key: string, fn: () => Promise<{ ok: boolean; error?: string } | undefined>, okMsg?: string, after?: () => void) => start(async () => {
    const r = await fn();
    if (r && !r.ok) setErr({ [key]: tr(t, r.error!) });
    else { setErr({}); if (okMsg) toast(okMsg, "ok"); after?.(); router.refresh(); }
  });
  const locked = me.isDemo;

  return (
    <div className="space-y-6">
      {locked && <p className="rounded-[24px] bg-butter p-4 text-sm">{t.settings.demo}</p>}

      <form className={`${card} space-y-3`} onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        run("profile", () => act.updateProfileAction({ ...f, studentNo: f.studentNo ?? undefined, password: f.password || undefined }), t.settings.saved);
      }}>
        <h2 className="font-display text-2xl font-bold">{t.settings.profile}</h2>
        <fieldset disabled={locked} className="space-y-3 disabled:opacity-60">
          <Field label={t.auth.name} name="name" defaultValue={me.name} required minLength={2} autoComplete="name" />
          <Field label={t.auth.email} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {email.trim().toLowerCase() !== me.email && <Field label={t.settings.pwForEmail} name="password" type="password" required autoComplete="current-password" />}
          {me.role !== "lecturer" && <Field label={t.auth.studentNo} hint={t.auth.optional} name="studentNo" defaultValue={me.studentNo ?? ""} inputMode="numeric" />}
          <FormError msg={err.profile ?? null} />
          <Submit busy={busy}>{t.common.save}</Submit>
        </fieldset>
      </form>

      <form className={`${card} space-y-3`} onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        run("pw", () => act.changePasswordAction({ current: f.get("current"), next: f.get("next") }), t.settings.pwDone, () => form.reset());
      }}>
        <h2 className="font-display text-2xl font-bold">{t.settings.password}</h2>
        <fieldset disabled={locked} className="space-y-3 disabled:opacity-60">
          <Field label={t.settings.current} name="current" type="password" required autoComplete="current-password" />
          <Field label={t.settings.next} hint={t.auth.pwHint} name="next" type="password" required minLength={8} autoComplete="new-password" />
          <FormError msg={err.pw ?? null} />
          <Submit busy={busy} className="bg-ink hover:bg-ink">{t.settings.update}</Submit>
        </fieldset>
      </form>

      {me.role !== "lecturer" && (
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{t.settings.groups}</h2>
            <Link href="/join" className="flex min-h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-sm font-semibold"><Plus size={15} /> <span className="hidden sm:inline">{t.settings.joinMore}</span></Link>
          </div>
          <ul className="mt-3 space-y-2">
            {groups.map((g) => {
              const komti = g.komtiId === me.id;
              return (
                <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${komti ? "bg-violet text-white" : "bg-white"}`}>{komti ? <Crown size={18} /> : <Users size={18} />}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{g.name}</b>
                    <span className="block truncate text-xs text-ink/50">{g.program} · {fmt(t.settings.members, { n: g.members })}{komti ? ` · ${t.settings.komtiBadge}` : ""}</span>
                  </span>
                  {komti
                    ? <Link href="/manage" className="min-h-10 rounded-full bg-white px-4 py-2 text-sm font-semibold">{t.nav.manage}</Link>
                    : <button disabled={busy || locked} onClick={() => { if (confirm(fmt(t.settings.leaveConfirm, { name: g.name }))) run("groups", () => act.leaveCohortAction(g.id), t.settings.left); }}
                        className="flex min-h-10 items-center gap-1.5 rounded-full bg-rose px-4 text-sm font-semibold text-rose-deep disabled:opacity-40"><LogOut size={15} /> {t.settings.leave}</button>}
                </li>
              );
            })}
            {groups.length === 0 && <li className="rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center text-sm text-ink/50"><Link href="/join" className="font-semibold text-violet">{t.settings.joinMore} →</Link></li>}
          </ul>
          <div className="mt-2"><FormError msg={err.groups ?? null} /></div>
        </section>
      )}

      <form className="space-y-3 rounded-[28px] border-2 border-rose bg-white p-5" onSubmit={(e) => {
        e.preventDefault();
        const pw = new FormData(e.currentTarget).get("password");
        if (confirm(t.settings.deleteConfirm)) run("del", () => act.deleteAccountAction({ password: pw }));
      }}>
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-rose-deep"><TriangleAlert size={20} /> {t.settings.danger}</h2>
        <p className="text-sm text-ink/60">{t.settings.dangerLead}</p>
        <p className="text-sm text-ink/60">{t.settings.dangerKomti}</p>
        <fieldset disabled={locked} className="space-y-3 disabled:opacity-60">
          <Field label={t.settings.current} name="password" type="password" required autoComplete="current-password" />
          <FormError msg={err.del ?? null} />
          <button disabled={busy} className="min-h-12 w-full rounded-full bg-rose-deep font-semibold text-white disabled:opacity-50">{t.settings.deleteBtn}</button>
        </fieldset>
      </form>
    </div>
  );
}
