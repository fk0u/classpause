"use client";

import { useState } from "react";
import { Activity, Timer, Inbox, CalendarClock, Check, Lock, Radio, Coffee, Users, FileHeart, CheckCircle2 } from "lucide-react";
import { useDemo, SLOTS, fmt } from "./demo-state";

export default function KomtiView() {
  const { status, sla, permissions, approvePermission, lockSlot, lockedSlot } = useDemo();
  const [pick, setPick] = useState("s1");
  const pending = permissions.filter((p) => p.status === "pending").length;
  const engineActive = status === "reschedule";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">Komti · Informatics &apos;26 Class A · 40 students</p>
        <h1 className="font-display text-2xl font-bold">Class Operations</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Activity, k: "Active classes", v: "3" },
          { icon: Timer, k: "SLA timers", v: status === "pending" ? "1" : "0", sub: status === "pending" ? fmt(sla) : "—" },
          { icon: Inbox, k: "Permissions", v: String(pending) },
        ].map((m) => (
          <div key={m.k} className="rounded-xl border border-slate-200 bg-white p-3">
            <m.icon size={16} className="text-indigo" />
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{m.v}</p>
            <p className="text-[11px] text-slate-500">{m.k}</p>
            {m.sub && <p className="font-mono text-[11px] tabular-nums text-amber-700">{m.sub}</p>}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-indigo" />
          <h2 className="font-display font-bold">Conflict-Free Slot Engine</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Digital Systems & Logic · checked against 40 KRS schedules and room availability (simulated data)</p>

        {!engineActive ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {lockedSlot
              ? <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald" /> Locked: {lockedSlot.day} {lockedSlot.time} · {lockedSlot.room}</span>
              : "No reschedule request right now. On the Lecturer tab, tap “Request Reschedule” to wake the engine."}
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-2">
              {SLOTS.map((s) => {
                const on = pick === s.id;
                return (
                  <button key={s.id} onClick={() => setPick(s.id)}
                    className={`flex min-h-16 items-center gap-3 rounded-xl border-2 p-3 text-left transition ${on ? "border-indigo bg-indigo/5" : "border-slate-200"}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-indigo bg-indigo text-white" : "border-slate-300"}`}>{on && <Check size={14} />}</span>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-indigo">Option {s.id.slice(1)} · {s.label}</p>
                      <p className="font-semibold">{s.kind === "async" ? <span className="flex items-center gap-1"><Coffee size={14} /> Convert to Micro-Pause + Q&A</span> : `${s.day}, ${s.time} · ${s.room}`}</p>
                      <p className={`font-mono text-xs ${s.kind === "alt" ? "text-amber-700" : "text-emerald-700"}`}>{s.meta}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => lockSlot(SLOTS.find((s) => s.id === pick)!)}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy font-semibold text-white">
              <Lock size={16} /> Lock & Broadcast Slot <Radio size={16} />
            </button>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <FileHeart size={18} className="text-indigo" />
          <h2 className="font-display font-bold">One-Door Permission Queue</h2>
        </div>
        <div className="mt-3 space-y-2">
          {permissions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Users size={16} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.name} <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-bold uppercase text-slate-500">{p.type}</span></p>
                <p className="truncate text-xs text-slate-500">{p.note}</p>
              </div>
              {p.status === "approved"
                ? <span className="text-xs font-semibold text-emerald-700">Excused</span>
                : <button onClick={() => approvePermission(p.id)} className="min-h-12 rounded-xl bg-emerald px-4 text-sm font-semibold text-navy">Approve</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
