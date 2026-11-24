"use client";

import { useTransition } from "react";
import { FlaskConical, Zap, TimerOff } from "lucide-react";
import { demoExpireAction, demoRestartAction } from "@/app/actions";
import { useLive } from "./live";

/** Judge/demo controls. Hidden when DEMO_MODE=false. */
export default function DemoBar({ classId, sessionId }: { classId: string; sessionId: string | null }) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  return (
    <div className="border-t border-amber-200 bg-amber-50/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-amber-900"><FlaskConical size={14} /> Demo clock</span>
        <span className="hidden text-amber-800 sm:inline">Digital Systems &amp; Logic</span>
        <div className="ml-auto flex gap-2">
          <button disabled={pending} onClick={() => start(async () => {
            const r = await demoRestartAction(classId);
            if (r.ok) toast("Lecturer magic link (would arrive via Telegram/WhatsApp):", "info", r.data!.url);
            else toast(r.error, "warn");
          })} className="flex min-h-9 items-center gap-1 rounded-lg bg-navy px-3 font-semibold text-white disabled:opacity-50">
            <Zap size={14} /> Start class now (H-2h prompt)
          </button>
          <button disabled={pending || !sessionId} onClick={() => start(async () => {
            const r = await demoExpireAction(sessionId);
            if (!r.ok) toast(r.error, "warn");
          })} className="flex min-h-9 items-center gap-1 rounded-lg bg-amber px-3 font-semibold text-navy disabled:opacity-50">
            <TimerOff size={14} /> Skip to H+15m
          </button>
        </div>
      </div>
    </div>
  );
}
