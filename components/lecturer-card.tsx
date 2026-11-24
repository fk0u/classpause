"use client";

import { useTransition } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, CalendarClock, Coffee, Lock, Loader2 } from "lucide-react";
import { SlaRing } from "./countdown";
import { fmtRange } from "@/lib/time";

export type LecturerAction = "confirm" | "delay" | "reschedule" | "micropause";

const ACTIONS = [
  { a: "confirm", icon: CheckCircle2, label: "Confirm on time", cls: "bg-emerald text-navy" },
  { a: "delay", icon: Clock, label: "Delay 20 min", cls: "bg-white border-2 border-slate-200 text-navy" },
  { a: "reschedule", icon: CalendarClock, label: "Reschedule (3 conflict-free slots)", cls: "bg-white border-2 border-slate-200 text-navy" },
  { a: "micropause", icon: Coffee, label: "Convert to Micro-Pause", cls: "bg-indigo text-white" },
] as const;

/** The chat-style 1-tap card. Same component on the dashboard and the magic-link page. */
export function LecturerCard({ className, section, startsAt, endsAt, room, enrolled, deadline, lecturer, onAction }: {
  className: string; section: string; startsAt: Date | string; endsAt: Date | string; room: string; enrolled: number;
  deadline: Date | string | null; lecturer: string; onAction: (a: LecturerAction) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-[#E7DED3] p-3 shadow-inner">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">CP</div>
        <div className="flex-1"><p className="text-sm font-semibold">ClassPause Bot</p><p className="text-[11px] text-slate-600">to {lecturer}</p></div>
        {deadline && <SlaRing deadline={deadline} size={52} />}
      </div>
      <motion.div initial={{ scale: 0.9, opacity: 0, originX: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
        className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm">
        <p className="text-[15px] leading-relaxed">
          <strong>“{className} ({section})”</strong> runs {fmtRange(startsAt, endsAt)} in {room}. Tap once to update <strong>{enrolled} students</strong>:
        </p>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Lock size={11} /> Single-use link · no login · expires at H+15m</p>
      </motion.div>
      <div className="mt-3 grid gap-2">
        {ACTIONS.map((x, i) => (
          <motion.button key={x.a} disabled={pending}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }} whileTap={{ scale: 0.97 }}
            onClick={() => start(() => onAction(x.a))}
            className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 text-left text-[15px] font-semibold shadow-sm disabled:opacity-50 ${x.cls}`}>
            {pending ? <Loader2 size={20} className="animate-spin" /> : <x.icon size={20} />} {x.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
