"use client";

import { useState } from "react";
import { Check, Copy, Play, Music2, Bell, MapPin, Zap, TimerOff, Radar, CalendarDays, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Avatar, AvatarStack } from "@/components/avatar";
import { SlaRing } from "@/components/countdown";

const COLORS = [
  { name: "ink", hex: "#0B0B0F", cls: "bg-ink", use: "Frame, primary buttons, dock" },
  { name: "paper", hex: "#F4F4F1", cls: "bg-paper", use: "Panel background" },
  { name: "mint", hex: "#CFF1D8", cls: "bg-mint", use: "Safe to commute, success" },
  { name: "butter", hex: "#F9E7AE", cls: "bg-butter", use: "Hold / waiting, SLA" },
  { name: "lilac", hex: "#EBD3F8", cls: "bg-lilac", use: "Micro-Pause, learning" },
  { name: "sky", hex: "#D3F0F8", cls: "bg-sky", use: "Reschedule, information" },
  { name: "rose", hex: "#FCD5DE", cls: "bg-rose", use: "Sick leave, alerts" },
];

const PRINCIPLES = [
  { t: "Zero typing", d: "Every decision is a tap. Lecturers get four options, students one primary action.", c: "bg-mint" },
  { t: "One colour, one meaning", d: "Each status owns a pastel tone everywhere: card, chip, calendar block, toast.", c: "bg-butter" },
  { t: "Thumb-first", d: "Primary actions live in the bottom dock and ≥ 44 px targets.", c: "bg-lilac" },
  { t: "Live, not refreshed", d: "Server pushes changes; screens animate into the new state.", c: "bg-sky" },
];

export default function DesignView() {
  const t = useT();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (hex: string) => { navigator.clipboard?.writeText(hex); setCopied(hex); setTimeout(() => setCopied(null), 1200); };
  const deadline = new Date(Date.now() + 9 * 60_000);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-5xl font-bold tracking-tight">{t.design.title} 🎨</h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-500">{t.design.lead}</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Principles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => <div key={p.t} className={`rounded-[28px] p-5 ${p.c}`}><p className="font-display text-xl font-semibold">{p.t}</p><p className="mt-2 text-sm text-ink/60">{p.d}</p></div>)}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Colour tokens</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map((c) => (
            <button key={c.name} onClick={() => copy(c.hex)} className="group rounded-[24px] bg-white p-2 text-left">
              <span className={`flex h-20 items-end justify-end rounded-[18px] p-2 ${c.cls} ${c.name === "paper" ? "ring-1 ring-slate-200" : ""}`}>
                <span className="rounded-full bg-white/80 p-1.5 opacity-0 transition group-hover:opacity-100">{copied === c.hex ? <Check size={12} /> : <Copy size={12} />}</span>
              </span>
              <p className="mt-2 px-1 font-semibold">{c.name}</p>
              <p className="px-1 font-mono text-xs text-slate-500">{c.hex}</p>
              <p className="px-1 pb-1 text-[11px] text-slate-400">{c.use}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-white p-6">
          <h2 className="font-display text-2xl font-semibold">Typography</h2>
          <p className="mt-4 font-display text-5xl font-bold tracking-tight">Outfit 48 Bold</p>
          <p className="font-display text-3xl font-semibold">Outfit 30 Semibold</p>
          <p className="mt-2 text-base">Inter 16 — body copy and long reading.</p>
          <p className="font-mono text-sm text-slate-500">JetBrains Mono 14 — times 09:20–11:00, codes CP-4F7050</p>
        </div>
        <div className="rounded-[28px] bg-white p-6">
          <h2 className="font-display text-2xl font-semibold">Shape &amp; controls</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="min-h-12 rounded-full bg-ink px-6 font-semibold text-white">Primary</button>
            <button className="min-h-12 rounded-full bg-paper px-6 font-semibold">Secondary</button>
            <span className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-deep">Safe to commute 👏</span>
            <span className="rounded-full bg-butter px-4 py-2 text-sm font-medium text-butter-deep">Hold commute ⏳</span>
            <span className="rounded-full bg-lilac px-4 py-2 text-sm font-medium text-lilac-deep">Micro-Pause 🎧</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Avatar name="Raka Pratama" size={48} />
            <AvatarStack names={["Naufal Hakim", "Sari Wulandari", "Budi Santoso"]} />
            <SlaRing deadline={deadline} size={60} />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-paper"><Bell size={18} /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-crimson ring-2 ring-white" /></span>
          </div>
          <p className="mt-4 text-sm text-slate-500">Radii: cards 28 px, hero cards 32 px, panel 36 px, controls fully round.</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Patterns</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500">Stat tiles</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[24px] bg-sky p-4 text-center"><p className="font-display text-3xl font-bold">4</p><p className="text-xs text-ink/60">Today</p></div>
              <div className="relative rounded-[24px] bg-mint p-4 text-center"><span className="absolute -right-1 -top-3 text-xl">🎉</span><p className="font-display text-3xl font-bold">2</p><p className="text-xs text-ink/60">Safe</p></div>
              <div className="rounded-[24px] border-2 border-dashed border-slate-300 p-4 text-center"><p className="font-display text-3xl font-bold">1</p><p className="text-xs text-ink/60">Hold</p></div>
            </div>
            <p className="pt-2 text-sm font-semibold text-slate-500">Session card on a timeline</p>
            <div className="relative pl-8">
              <span className="dashed-rail absolute bottom-0 left-[11px] top-0 w-0.5" />
              <span className="absolute left-[6px] top-7 h-3 w-3 rounded-full bg-mint-deep ring-4 ring-paper" />
              <div className="rounded-[28px] bg-white p-5">
                <p className="font-display text-xl font-semibold">Digital Systems &amp; Logic</p>
                <p className="mt-1 flex gap-3 text-sm text-slate-500"><span className="font-mono">09:20–11:00</span><span className="flex items-center gap-1"><MapPin size={13} />A-102</span></p>
                <span className="mt-3 inline-block rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-mint-deep">Safe to commute 👏</span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-500">Micro-Pause play card</p>
            <div className="relative -rotate-1 overflow-hidden rounded-[32px] bg-lilac p-6 shadow-xl shadow-lilac-deep/20">
              <Music2 size={22} className="float absolute right-24 top-5 text-white" />
              <p className="text-xs font-semibold uppercase tracking-widest text-lilac-deep">Micro-Pause · 15 min</p>
              <p className="mt-1 font-display text-3xl font-semibold leading-tight">NAND as a Universal Gate</p>
              <span className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-white/70">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white"><Play size={22} fill="currentColor" /></span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500">Event / request card</p>
            <div className="rounded-[28px] bg-butter p-4">
              <p className="text-sm font-medium">📌 Dispensation</p>
              <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm">Regional debate competition</div>
            </div>
            <p className="pt-2 text-sm font-semibold text-slate-500">Dock</p>
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-ink p-2">
              <span className="flex h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"><Radar size={18} /> Radar</span>
              <span className="flex h-12 w-11 items-center justify-center text-white/70"><CalendarDays size={18} /></span>
              <span className="flex h-12 w-11 items-center justify-center text-white/70"><UserRound size={18} /></span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint"><Zap size={18} /></span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter"><TimerOff size={18} /></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
