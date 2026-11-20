"use client";

import { CheckCircle2, Clock, CalendarClock, Coffee, ShieldCheck, Lock } from "lucide-react";
import { useDemo } from "./demo-state";

const ACTIONS = [
  { a: "confirm", icon: CheckCircle2, label: "Confirm On-Time (Room A-102)", cls: "bg-emerald text-navy" },
  { a: "delay", icon: Clock, label: "Delay 20 Mins / Shift Online", cls: "bg-white border-2 border-slate-200 text-navy" },
  { a: "reschedule", icon: CalendarClock, label: "Request Reschedule (3 Conflict-Free Slots)", cls: "bg-white border-2 border-slate-200 text-navy" },
  { a: "micropause", icon: Coffee, label: "Convert to Micro-Pause (Async)", cls: "bg-indigo text-white" },
] as const;

export default function LecturerView() {
  const { lecturerAction, lecturerPrompted, status } = useDemo();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Simulated WhatsApp / Telegram webhook message</p>
        <h1 className="font-display text-2xl font-bold">Lecturer 1-Tap Card</h1>
      </div>

      <div className="rounded-3xl bg-[#E7DED3] p-3 shadow-inner">
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">CP</div>
          <div><p className="text-sm font-semibold">ClassPause Bot</p><p className="text-[11px] text-slate-600">to Dr. Naufal · 08:00</p></div>
        </div>

        <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm">
          <p className="text-[15px] leading-relaxed">
            Reminder: <strong>&ldquo;Digital Systems (Class A)&rdquo;</strong> starts in 2 hours (10:00 AM, Room A-102).
            Tap once to update <strong>40 students</strong>:
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Lock size={11} /> Magic link · no login · expires at 10:15</div>
        </div>

        <div className="mt-3 grid gap-2">
          {ACTIONS.map((x) => (
            <button key={x.a} disabled={!lecturerPrompted} onClick={() => lecturerAction(x.a)}
              className={`flex min-h-14 items-center gap-3 rounded-xl px-4 text-left text-[15px] font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-40 ${x.cls}`}>
              <x.icon size={20} /> {x.label}
            </button>
          ))}
        </div>
      </div>

      {!lecturerPrompted && (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald" />
          <span>Response recorded (<strong className="text-navy">{status}</strong>). Students already see the update on their radar. Press <em>Simulate H-2h</em> to send a fresh card.</span>
        </div>
      )}

      <p className="text-xs text-slate-500">Zero typing: 4 options cover every outcome, so a busy lecturer never has to write a reply (Hick&apos;s Law).</p>
    </div>
  );
}
