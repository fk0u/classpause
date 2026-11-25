"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckCheck, Bell, CalendarClock, Coffee, ShieldCheck, FileHeart, BellRing, ArrowUpRight } from "lucide-react";
import type { getInbox } from "@/lib/queries";
import { markInboxRead } from "@/app/actions";
import { useT, fmt } from "@/lib/i18n/client";
import { fmtDateTime } from "@/lib/time";

type Item = Awaited<ReturnType<typeof getInbox>>[number];

const KIND: Record<string, { bg: string; icon: typeof Bell }> = {
  prompt: { bg: "bg-butter", icon: BellRing },
  confirmed: { bg: "bg-mint", icon: ShieldCheck },
  delayed: { bg: "bg-butter", icon: CalendarClock },
  reschedule: { bg: "bg-sky", icon: CalendarClock },
  moved: { bg: "bg-sky", icon: CalendarClock },
  micropause: { bg: "bg-lilac", icon: Coffee },
  expired: { bg: "bg-lilac", icon: Coffee },
  request: { bg: "bg-rose", icon: FileHeart },
  decision: { bg: "bg-mint", icon: FileHeart },
};

export default function InboxView({ items }: { items: Item[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = items.filter((i) => !i.readAt).length;

  const open = (i: Item) => start(async () => { if (!i.readAt) await markInboxRead(i.id); router.push(i.url); });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{fmt(t.inbox.unread, { n: unread })}</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">{t.inbox.title}</h1>
          <p className="mt-1 text-slate-500">{t.inbox.lead}</p>
        </div>
        {unread > 0 && (
          <button disabled={pending} onClick={() => start(async () => { await markInboxRead(); router.refresh(); })}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-50">
            <CheckCheck size={16} /> {t.inbox.markAll}
          </button>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {items.map((i, idx) => {
            const k = KIND[i.kind] ?? { bg: "bg-white", icon: Bell };
            return (
              <motion.li key={i.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 8) * 0.03 }}>
                <button onClick={() => open(i)} className={`group flex w-full items-start gap-4 rounded-[28px] p-4 text-left transition hover:-translate-y-0.5 ${i.readAt ? "bg-white" : k.bg}`}>
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
                    <k.icon size={18} />
                    {!i.readAt && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-crimson ring-2 ring-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-display text-lg font-semibold leading-tight">{i.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-ink/50 sm:ml-auto">{fmtDateTime(i.createdAt, t.locale)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink/70">{i.body}</span>
                  </span>
                  <ArrowUpRight size={18} className="mt-1 shrink-0 text-ink/30 transition group-hover:text-ink" />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {items.length === 0 && <li className="rounded-[28px] border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">{t.inbox.empty}</li>}
      </ul>
      <p className="mt-6 text-center text-sm text-slate-500"><Link href="/profile" className="underline underline-offset-4">{t.profile.notifications}</Link></p>
    </div>
  );
}
