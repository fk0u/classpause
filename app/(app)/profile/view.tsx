"use client";

import { motion } from "motion/react";
import { LogOut, Mail, IdCard, BadgeCheck } from "lucide-react";
import type { getProfile } from "@/lib/queries";
import { Avatar } from "@/components/avatar";
import LangSwitch from "@/components/lang-switch";
import PushToggle from "@/components/push-toggle";
import InstallCard from "@/components/install-card";
import { useT } from "@/lib/i18n/client";
import { fmtDateTime } from "@/lib/time";
import { signOutAction } from "@/app/actions";

type Props = {
  user: { name: string; email: string; role: "student" | "komti" | "lecturer"; studentNo: string | null };
  profile: Awaited<ReturnType<typeof getProfile>>;
  push: { configured: boolean; publicKey: string };
};

export default function ProfileView({ user, profile, push }: Props) {
  const t = useT();
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[340px_1fr]">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[32px] bg-ink p-6 text-white">
        <span aria-hidden className="float absolute right-6 top-6 h-6 w-6 rounded-full bg-lilac" />
        <span aria-hidden className="float absolute bottom-24 left-6 h-3 w-3 rounded-full bg-mint [animation-delay:1.5s]" />
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="rounded-full p-1.5 ring-2 ring-white/20"><Avatar name={user.name} size={96} /></span>
          <h1 className="mt-4 font-display text-3xl font-bold">{user.name}</h1>
          <span className="mt-2 rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink">{t.roles[user.role]}</span>
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          {user.studentNo && <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><IdCard size={16} className="text-white/60" /><dt className="text-white/60">{t.profile.studentNo}</dt><dd className="ml-auto font-mono">{user.studentNo}</dd></div>}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><Mail size={16} className="text-white/60" /><dt className="text-white/60">{t.profile.email}</dt><dd className="ml-auto truncate">{user.email}</dd></div>
        </dl>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { n: profile.classes, k: t.profile.statClasses, c: "bg-sky" },
            { n: profile.receipts.length, k: t.profile.statPauses, c: "bg-lilac" },
            { n: profile.requests, k: t.profile.statRequests, c: "bg-butter" },
          ].map((m) => (
            <div key={m.k} className={`rounded-2xl p-3 text-ink ${m.c}`}>
              <p className="font-display text-2xl font-bold">{m.n}</p>
              <p className="text-[11px] leading-tight text-ink/60">{m.k}</p>
            </div>
          ))}
        </div>
        <form action={signOutAction} className="mt-6">
          <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 font-semibold hover:bg-white/20"><LogOut size={16} /> {t.common.signOut}</button>
        </form>
      </motion.section>

      <div className="space-y-4">
        <section className="rounded-[28px] bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-semibold">{t.profile.language}</h2>
              <p className="text-sm text-slate-500">{t.profile.languageLead}</p>
            </div>
            <LangSwitch />
          </div>
        </section>

        <PushToggle configured={push.configured} publicKey={push.publicKey} />
        <InstallCard />

        <section className="rounded-[28px] bg-white p-5">
          <h2 className="font-display text-xl font-semibold">{t.profile.receipts}</h2>
          <ul className="mt-3 space-y-2">
            {profile.receipts.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-lilac/60 p-3">
                <BadgeCheck size={18} className="shrink-0 text-lilac-deep" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.className}</p>
                  <p className="font-mono text-xs text-ink/50">{fmtDateTime(r.startsAt, t.locale)}</p>
                </div>
                <span className="font-mono text-sm font-bold">{r.code}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{r.correct}/{r.total}</span>
              </li>
            ))}
            {profile.receipts.length === 0 && <li className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">{t.profile.noReceipts}</li>}
          </ul>
        </section>
        <a href="/design" className="block rounded-[28px] border-2 border-dashed border-slate-300 p-4 text-center text-sm font-semibold text-slate-500 hover:text-ink">🎨 {t.nav.design}</a>
      </div>
    </div>
  );
}
