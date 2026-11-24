"use client";

import { useTransition } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, CalendarClock, Coffee, Lock, Loader2, Users } from "lucide-react";
import { SlaRing } from "./countdown";
import { fmtRange } from "@/lib/time";
import { useT, fmt } from "@/lib/i18n/client";

export type LecturerAction = "confirm" | "delay" | "reschedule" | "micropause";

const ACTIONS = [
  { a: "confirm", icon: CheckCircle2, cls: "bg-mint" },
  { a: "delay", icon: Clock, cls: "bg-butter" },
  { a: "reschedule", icon: CalendarClock, cls: "bg-sky" },
  { a: "micropause", icon: Coffee, cls: "bg-lilac" },
] as const;

/** The 1-tap card. Same component on the dashboard and the magic-link page. */
export function LecturerCard({ className, section, startsAt, endsAt, room, enrolled, deadline, lecturer, onAction }: {
  className: string; section: string; startsAt: Date | string; endsAt: Date | string; room: string; enrolled: number;
  deadline: Date | string | null; lecturer: string; onAction: (a: LecturerAction) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const t = useT();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">{fmt(t.lecturer.for, { name: lecturer })}</p>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">{className} <span className="text-ink/40">({section})</span></h3>
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-sm text-slate-500">
            <span className="font-mono">{fmtRange(startsAt, endsAt)}</span><span>{room}</span>
            <span className="flex items-center gap-1"><Users size={13} />{enrolled} {t.common.students}</span>
          </p>
        </div>
        {deadline && <SlaRing deadline={deadline} size={62} />}
      </div>
      <p className="mt-3 rounded-2xl bg-paper p-3 text-sm text-slate-600">{t.lecturer.tapOnce}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ACTIONS.map((x, i) => (
          <motion.button key={x.a} disabled={pending}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }}
            onClick={() => start(() => onAction(x.a))}
            className={`flex min-h-24 flex-col justify-between rounded-[24px] p-4 text-left disabled:opacity-50 ${x.cls}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80">{pending ? <Loader2 size={18} className="animate-spin" /> : <x.icon size={18} />}</span>
            <span>
              <span className="block font-display text-base font-semibold leading-tight">{t.lecturer[x.a]}</span>
              <span className="block text-xs text-ink/55">{t.lecturer[`${x.a}Sub`]}</span>
            </span>
          </motion.button>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-400"><Lock size={11} /> {t.lecturer.linkNote}</p>
    </motion.div>
  );
}
