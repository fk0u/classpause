"use client";

import { useEffect, useState } from "react";
import { Pause, GraduationCap, ClipboardList, MessageSquareText, Palette, Zap, TimerOff, RotateCcw } from "lucide-react";
import { DemoProvider, useDemo } from "@/components/demo-state";
import StudentView from "@/components/StudentView";
import KomtiView from "@/components/KomtiView";
import LecturerView from "@/components/LecturerView";
import DesignSystem from "@/components/DesignSystem";

const TABS = [
  { id: "student", label: "Student Radar", icon: GraduationCap },
  { id: "komti", label: "Komti / Coordinator", icon: ClipboardList },
  { id: "lecturer", label: "Lecturer 1-Tap Card", icon: MessageSquareText },
  { id: "ds", label: "Design System", icon: Palette },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Shell() {
  const [tab, setTab] = useState<Tab>("student");
  const { triggerH2, timeoutSla, reset, toasts, lecturerPrompted, status } = useDemo();

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const badge = (id: Tab) =>
    (id === "lecturer" && lecturerPrompted) || (id === "komti" && status === "reschedule");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo text-white"><Pause size={16} fill="currentColor" /></div>
            <span className="font-display font-bold">ClassPause</span>
            <span className="rounded border border-slate-300 px-1.5 font-mono text-[10px] text-slate-500">DEMO</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5 text-xs">
            <button onClick={triggerH2} className="flex min-h-9 items-center gap-1 rounded-lg bg-navy px-3 font-semibold text-white"><Zap size={14} /> Simulate H-2h</button>
            <button onClick={timeoutSla} className="flex min-h-9 items-center gap-1 rounded-lg bg-amber px-3 font-semibold text-navy"><TimerOff size={14} /> Simulate H+15m Timeout</button>
            <button onClick={reset} className="flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 font-semibold text-slate-600"><RotateCcw size={14} /> Reset</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition
                ${tab === t.id ? "border-indigo text-indigo" : "border-transparent text-slate-500 hover:text-navy"}`}>
              <t.icon size={16} /> {t.label}
              {badge(t.id) && <span className="h-2 w-2 animate-pulse rounded-full bg-crimson" />}
            </button>
          ))}
        </nav>
      </header>

      <main className={tab === "ds" ? "mx-auto max-w-6xl px-4 sm:px-8" : "mx-auto max-w-md px-4 pb-40 pt-5"}>
        {tab === "student" && <StudentView />}
        {tab === "komti" && <KomtiView />}
        {tab === "lecturer" && <LecturerView />}
        {tab === "ds" && <DesignSystem />}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center font-mono text-[11px] text-slate-500">
        ClassPause MVP Prototype v0.1 — STACK 2026 Semifinal Build (Simulated East Kalimantan Campus Dataset)
      </footer>

      <div className="pointer-events-none fixed inset-x-0 top-28 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.tone === "ok" ? "bg-emerald text-navy" : t.tone === "warn" ? "bg-amber text-navy" : "bg-navy text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <DemoProvider><Shell /></DemoProvider>;
}
