"use client";

import { useTransition } from "react";
import { motion } from "motion/react";
import { Zap, TimerOff, FlaskConical, Loader2 } from "lucide-react";
import { demoExpireAction, demoRestartAction } from "@/app/actions";
import { useLive } from "./live";

/** Floating black dock at the bottom, like the reference toolbar. Holds the demo clock. */
export default function Dock({ demo }: { demo: { classId: string; sessionId: string | null } | null }) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  if (!demo) return null;

  const btn = "group relative flex h-12 w-12 items-center justify-center rounded-full text-ink transition hover:scale-110 disabled:opacity-40";
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
      className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-ink p-2 pl-4 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold text-white/70 sm:flex">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />} Demo clock
        </span>
        <button disabled={pending} title="Start class now (sends the H-2h card)" aria-label="Start class now"
          onClick={() => start(async () => {
            const r = await demoRestartAction(demo.classId);
            if (r.ok) toast("Lecturer magic link (would arrive via Telegram/WhatsApp):", "info", r.data!.url);
            else toast(r.error, "warn");
          })} className={`${btn} bg-mint`}>
          <Zap size={20} />
        </button>
        <button disabled={pending || !demo.sessionId} title="Skip to H+15m (SLA timeout)" aria-label="Skip to H+15m"
          onClick={() => start(async () => { const r = await demoExpireAction(demo.sessionId); if (!r.ok) toast(r.error, "warn"); })}
          className={`${btn} bg-butter`}>
          <TimerOff size={20} />
        </button>
        <span className="hidden pr-3 text-xs text-white/50 md:inline">Start class · Skip to H+15m</span>
      </div>
    </motion.div>
  );
}
