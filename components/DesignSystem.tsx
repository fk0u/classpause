"use client";

import { useEffect, useState } from "react";
import {
  Eye, ListChecks, Timer, Hand, Copy, Check, CheckCircle2, Clock, Coffee, MapPin,
  CalendarClock, Users, BadgeCheck, Play, Pause, RotateCcw, Navigation, BookOpen, ShieldCheck, ChevronRight,
} from "lucide-react";

/* ---------- Shared primitives ---------- */

function Section({ id, eyebrow, title, intro, children }: {
  id: string; eyebrow: string; title: string; intro?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-slate-200 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">{title}</h2>
      {intro && <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Rationale({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-4 border-indigo bg-indigo/5 px-4 py-3 text-sm text-slate-700">
      <span className="font-semibold text-indigo">Psychological rationale · </span>{children}
    </div>
  );
}

function PatternFrame({ label, title, children, rationale }: {
  label: string; title: string; children: React.ReactNode; rationale: React.ReactNode;
}) {
  return (
    <div className="mb-14">
      <div className="flex items-baseline gap-3">
        <span className="rounded bg-navy px-2 py-0.5 font-mono text-xs text-white">{label}</span>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
        [background-image:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
        {children}
      </div>
      <Rationale>{rationale}</Rationale>
    </div>
  );
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ---------- 1. Principles ---------- */

const PRINCIPLES = [
  { icon: Eye, color: "text-emerald", n: "01", name: "Pre-Attentive Processing",
    applied: "Traffic-Light Commute Signals",
    body: "Color hue is processed in under 250ms, before conscious attention. A student on a bus glances once: green means go, amber means wait, indigo means stay home and learn. No reading required." },
  { icon: ListChecks, color: "text-indigo", n: "02", name: "Hick's Law & Cognitive Offloading",
    applied: "3-Card Choice Architecture",
    body: "Decision time grows logarithmically with options. Lecturers never browse a calendar; the system pre-resolves conflicts and offers exactly three conflict-free makeup slots." },
  { icon: Timer, color: "text-amber", n: "03", name: "Zeigarnik Effect",
    applied: "15-Minute Micro-Pause Progress Rings",
    body: "Unfinished tasks stay mentally active. An open progress ring creates gentle tension that pulls learners to complete the module, converting a cancelled class into verified learning." },
  { icon: Hand, color: "text-crimson", n: "04", name: "Fitts's Law",
    applied: "Thumb-Zone Bottom Action Anchors",
    body: "Target acquisition time depends on distance and size. Primary actions live in the bottom third of the screen with 48px minimum targets, reachable one-handed while commuting." },
];

/* ---------- 2. Colors ---------- */

const COLORS = [
  { name: "Canvas", hex: "#F8FAFC", token: "--color-canvas", role: "App background, low-arousal surface", text: "#0F172A", border: true },
  { name: "Deep Navy", hex: "#0F172A", token: "--color-navy", role: "Primary text, authority chrome", text: "#FFFFFF" },
  { name: "Pause Indigo", hex: "#4338CA", token: "--color-indigo", role: "Brand · Micro-Pause learning state", text: "#FFFFFF" },
  { name: "Confirmed Emerald", hex: "#10B981", token: "--color-emerald", role: "Class confirmed · go signal", text: "#0F172A" },
  { name: "SLA Amber", hex: "#F59E0B", token: "--color-amber", role: "Pending lecturer decision · hold", text: "#0F172A" },
  { name: "Alert Crimson", hex: "#EF4444", token: "--color-crimson", role: "Cancelled · SLA breach · destructive", text: "#FFFFFF" },
];

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function Swatch({ c }: { c: (typeof COLORS)[number] }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(c.hex); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button onClick={copy}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-28 items-start justify-end p-3 ${c.border ? "border-b border-slate-200" : ""}`}
        style={{ background: c.hex, color: c.text }}>
        <span className="flex items-center gap-1 rounded-md bg-black/10 px-2 py-1 font-mono text-xs opacity-0 transition group-hover:opacity-100">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">{c.name}</p>
          <p className="font-mono text-sm text-slate-500">{c.hex}</p>
        </div>
        <p className="mt-1 font-mono text-[11px] text-slate-400">{c.token}</p>
        <p className="mt-2 text-sm text-slate-600">{c.role}</p>
      </div>
    </button>
  );
}

function ContrastMatrix() {
  const fgs = COLORS.filter((c) => c.name !== "Canvas");
  const bgs = [COLORS[0], { ...COLORS[0], name: "White", hex: "#FFFFFF" }, COLORS[1]];
  const grade = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "Fail");
  const tone = (r: number) =>
    r >= 4.5 ? "bg-emerald/10 text-emerald-700" : r >= 3 ? "bg-amber/15 text-amber-700" : "bg-crimson/10 text-red-700";
  return (
    <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-display font-semibold">Foreground ↓ / Background →</th>
            {bgs.map((b) => (
              <th key={b.name} className="px-4 py-3 font-display font-semibold">
                <span className="mr-2 inline-block h-3 w-3 rounded-sm border border-slate-300 align-middle" style={{ background: b.hex }} />
                {b.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fgs.map((f) => (
            <tr key={f.name} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">
                <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: f.hex }} />
                {f.name}
              </td>
              {bgs.map((b) => {
                const r = f.hex === b.hex ? 1 : contrast(f.hex, b.hex);
                return (
                  <td key={b.name} className="px-4 py-3">
                    <span className="font-mono tabular-nums">{r.toFixed(2)}:1</span>
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${tone(r)}`}>{grade(r)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Rule: Emerald and Amber are <strong>signal fills</strong>, never body text on light surfaces. Pair them with Deep Navy labels
        and always add an icon so state is never communicated by color alone (WCAG 1.4.1).
      </p>
    </div>
  );
}

/* ---------- 4A. Commute Radar ---------- */

function useCountdown(start: number) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v <= 0 ? start : v - 1)), 1000);
    return () => clearInterval(t);
  }, [start]);
  return s;
}

function RadarCard({ tone, icon: Icon, status, headline, children }: {
  tone: "emerald" | "amber" | "indigo"; icon: React.ElementType; status: string; headline: string; children: React.ReactNode;
}) {
  const map = {
    emerald: { bar: "bg-emerald", chip: "bg-emerald text-navy", ring: "ring-emerald/30" },
    amber: { bar: "bg-amber", chip: "bg-amber text-navy", ring: "ring-amber/30" },
    indigo: { bar: "bg-indigo", chip: "bg-indigo text-white", ring: "ring-indigo/30" },
  }[tone];
  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-4 ${map.ring}`}>
      <div className={`h-2 ${map.bar}`} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${map.chip}`}>
            <Icon size={14} /> {status}
          </span>
          <span className="font-mono text-xs text-slate-400">08:00 · R.204</span>
        </div>
        <p className="mt-4 font-display text-lg font-bold leading-snug">{headline}</p>
        <p className="text-sm text-slate-500">Data Structures · Dr. Rahman</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function CommuteRadar() {
  const sla = useCountdown(14 * 60 + 32);
  const pct = sla / (15 * 60);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <RadarCard tone="emerald" icon={CheckCircle2} status="Confirmed" headline="Class is on. Leave now.">
        <div className="flex items-center gap-2 rounded-lg bg-emerald/10 px-3 py-2 text-sm text-emerald-800">
          <Navigation size={16} /> 22 min commute · arrive 07:52
        </div>
      </RadarCard>
      <RadarCard tone="amber" icon={Clock} status="SLA Hold" headline="Lecturer deciding. Don't leave yet.">
        <div className="rounded-lg bg-amber/10 px-3 py-2">
          <div className="flex items-center justify-between text-sm text-amber-800">
            <span>Decision due in</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-navy">{fmt(sla)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber/20">
            <div className="h-full bg-amber transition-all duration-1000 ease-linear" style={{ width: `${pct * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-amber-800">Auto-switches to Micro-Pause if SLA expires.</p>
        </div>
      </RadarCard>
      <RadarCard tone="indigo" icon={Coffee} status="Micro-Pause" headline="Stay home. 15-min module ready.">
        <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo text-sm font-semibold text-white hover:bg-indigo/90">
          <Play size={16} /> Start Micro-Pause
        </button>
      </RadarCard>
    </div>
  );
}

/* ---------- 4B. Slot selector ---------- */

const SLOTS = [
  { day: "Thu", date: "Nov 26", time: "10:00 – 11:40", room: "R.204", free: "38/40 students free", score: 95, tag: "Best fit" },
  { day: "Fri", date: "Nov 27", time: "13:00 – 14:40", room: "Lab C2", free: "36/40 students free", score: 90 },
  { day: "Sat", date: "Nov 28", time: "08:00 – 09:40", room: "Online", free: "40/40 students free", score: 84 },
];

function SlotSelector() {
  const [sel, setSel] = useState<number | null>(0);
  const [done, setDone] = useState(false);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <CalendarClock size={16} className="text-indigo" />
        Reschedule <strong className="text-navy">Data Structures</strong> · 3 conflict-free options (from 47 checked)
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {SLOTS.map((s, i) => {
          const active = sel === i;
          return (
            <button key={i} onClick={() => { setSel(i); setDone(false); }}
              className={`relative rounded-xl border-2 bg-white p-5 text-left transition ${active ? "border-indigo shadow-lg shadow-indigo/10" : "border-slate-200 hover:border-slate-300"}`}>
              {s.tag && <span className="absolute -top-2.5 left-4 rounded-full bg-indigo px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{s.tag}</span>}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-2xl font-bold">{s.day}</p>
                  <p className="text-sm text-slate-500">{s.date}</p>
                </div>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${active ? "border-indigo bg-indigo text-white" : "border-slate-300"}`}>
                  {active && <Check size={14} />}
                </span>
              </div>
              <p className="mt-3 font-mono text-sm tabular-nums">{s.time}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600"><MapPin size={12} /> {s.room}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700"><Users size={12} /> {s.free}</p>
              <div className="mt-3 h-1 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald" style={{ width: `${s.score}%` }} />
              </div>
            </button>
          );
        })}
      </div>
      <button disabled={sel === null} onClick={() => setDone(true)}
        className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition ${done ? "bg-emerald text-navy" : "bg-navy text-white hover:bg-navy/90"}`}>
        {done ? <><CheckCircle2 size={18} /> Booked · 40 students notified</> : <>Confirm {sel !== null && `${SLOTS[sel].day} ${SLOTS[sel].time}`} <ChevronRight size={18} /></>}
      </button>
    </div>
  );
}

/* ---------- 4C. Zeigarnik stepper ---------- */

const STEPS = [
  { t: "Concept primer", m: 3 }, { t: "Worked example", m: 5 }, { t: "Quick check (3 Qs)", m: 4 }, { t: "Reflection note", m: 3 },
];
const TOTAL = 15 * 60;

function Ring({ pct }: { pct: number }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#E0E7FF" strokeWidth="12" />
      <circle cx="80" cy="80" r={r} fill="none" stroke={pct >= 1 ? "#10B981" : "#4338CA"} strokeWidth="12"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-500" />
    </svg>
  );
}

function MicroPause() {
  const [elapsed, setElapsed] = useState(9 * 60 + 40);
  const [running, setRunning] = useState(false);
  const [stamp, setStamp] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => Math.min(TOTAL, e + 30)), 200); // 30× demo speed
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (elapsed >= TOTAL && !stamp) {
      setRunning(false);
      setStamp(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    }
  }, [elapsed, stamp]);

  const pct = elapsed / TOTAL;
  let acc = 0;
  const stepIdx = STEPS.findIndex((s) => (acc += s.m * 60) > elapsed);

  return (
    <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
      <div className="relative mx-auto">
        <Ring pct={pct} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tabular-nums">{fmt(TOTAL - elapsed)}</span>
          <span className="text-xs text-slate-500">{Math.round(pct * 100)}% complete</span>
        </div>
      </div>

      <div>
        <p className="font-display text-lg font-bold">Micro-Pause · Binary Search Trees</p>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, i) => {
            const state = stamp || i < stepIdx ? "done" : i === stepIdx ? "now" : "next";
            return (
              <li key={i} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                  ${state === "done" ? "bg-emerald text-white" : state === "now" ? "bg-indigo text-white ring-4 ring-indigo/20" : "bg-slate-100 text-slate-400"}`}>
                  {state === "done" ? <Check size={14} /> : i + 1}
                </span>
                <span className={`text-sm ${state === "next" ? "text-slate-400" : "font-medium"}`}>{s.t}</span>
                <span className="ml-auto font-mono text-xs text-slate-400">{s.m} min</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 flex gap-2">
          <button onClick={() => setRunning((r) => !r)} disabled={!!stamp}
            className="flex min-h-12 items-center gap-2 rounded-lg bg-indigo px-5 font-semibold text-white disabled:opacity-40">
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume (30× demo)</>}
          </button>
          <button onClick={() => { setElapsed(9 * 60 + 40); setStamp(null); setRunning(false); }}
            className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm text-slate-600">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className={`w-full rounded-xl border-2 border-dashed p-5 transition md:w-64
        ${stamp ? "border-emerald bg-emerald/5" : "border-slate-200 bg-slate-50 opacity-60"}`}>
        <div className="flex items-center gap-2">
          <BadgeCheck className={stamp ? "text-emerald" : "text-slate-400"} />
          <p className="font-display font-bold">{stamp ? "Attendance Verified" : "Receipt locked"}</p>
        </div>
        <dl className="mt-4 space-y-2 font-mono text-[11px]">
          <div className="flex justify-between"><dt className="text-slate-500">Student</dt><dd>STU-0421</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Course</dt><dd>CS-201</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Duration</dt><dd className="tabular-nums">{fmt(elapsed)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Quiz</dt><dd>{stamp ? "3/3" : "—"}</dd></div>
          <div className="border-t border-slate-200 pt-2 text-slate-500">Timestamp</div>
          <dd className="tabular-nums">{stamp ?? "Complete module to issue"}</dd>
        </dl>
        {stamp && <p className="mt-3 flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck size={12} /> Synced to SIAKAD</p>}
      </div>
    </div>
  );
}

/* ---------- 4D. Thumb-zone bottom sheet ---------- */

function ThumbZone() {
  const [overlay, setOverlay] = useState(true);
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <div className="relative mx-auto h-[600px] w-[300px] overflow-hidden rounded-[44px] border-[10px] border-navy bg-canvas shadow-2xl">
        <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-navy" />
        <div className="p-5 pt-12">
          <p className="text-xs text-slate-500">Thursday · 07:31</p>
          <p className="font-display text-xl font-bold">Good morning</p>
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase text-navy"><Clock size={10} /> SLA Hold</span>
            <p className="mt-2 text-sm font-semibold">Data Structures · 08:00</p>
          </div>
        </div>

        {overlay && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
            <div className="flex flex-1 items-start justify-end bg-crimson/10 p-2 text-[10px] font-bold uppercase text-red-700">Stretch</div>
            <div className="flex flex-1 items-start justify-end bg-amber/10 p-2 text-[10px] font-bold uppercase text-amber-700">OK</div>
            <div className="flex flex-1 items-start justify-end bg-emerald/15 p-2 text-[10px] font-bold uppercase text-emerald-700">Natural</div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl bg-white p-4 pb-6 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
          <p className="mb-3 text-center text-xs text-slate-500">What will you do?</p>
          <button className="relative flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-indigo font-semibold text-white">
            <BookOpen size={18} /> Start Micro-Pause
            {overlay && <span className="absolute -right-1 -top-2 rounded bg-navy px-1 font-mono text-[9px] text-white">56px</span>}
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["Wait for update", "Navigate"].map((l) => (
              <button key={l} className="relative h-12 rounded-xl border border-slate-200 text-sm font-medium">
                {l}
                {overlay && <span className="absolute -right-1 -top-2 rounded bg-navy px-1 font-mono text-[9px] text-white">48px</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} className="peer sr-only" />
          <span className="relative h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-indigo after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
          <span className="text-sm font-medium">Show thumb-zone heatmap & target sizes</span>
        </label>
        <div className="mt-6 space-y-3">
          {[
            ["Min touch target", "48 × 48 px", "WCAG 2.5.5 / Material"],
            ["Primary action height", "56 px", "Largest, closest target"],
            ["Target spacing", "8 px", "Prevents mis-taps on a moving bus"],
            ["Action zone", "Bottom 33%", "Natural thumb arc, one hand"],
          ].map(([k, v, n]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div><p className="text-sm font-medium">{k}</p><p className="text-xs text-slate-500">{n}</p></div>
              <span className="font-mono text-sm font-semibold text-indigo">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

const NAV = [["principles", "Principles"], ["color", "Color"], ["type", "Typography"], ["patterns", "Patterns"]];

export default function DesignSystem() {
  return (
    <div>

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        {/* Hero */}
        <div className="py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo">Design System & Component Kit</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Designed for the <span className="text-indigo">8 seconds</span> a student has at a bus stop.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            ClassPause turns last-minute class cancellations into verified micro-learning. Every token and component
            below is grounded in a measurable principle from cognitive psychology, not aesthetic preference.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs">
            {["6 color tokens", "3 typefaces", "4 core patterns", "WCAG 2.2 AA", "48px touch floor"].map((t) => (
              <span key={t} className="rounded-full border border-slate-300 bg-white px-3 py-1.5">{t}</span>
            ))}
          </div>
        </div>

        <Section id="principles" eyebrow="01 · Foundations" title="Cognitive Design Principles"
          intro="Four laws of human perception and decision-making that every ClassPause screen must satisfy.">
          <div className="grid gap-5 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ${p.color}`}><p.icon size={22} /></div>
                  <span className="font-mono text-3xl font-bold text-slate-200">{p.n}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold text-indigo">→ {p.applied}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="color" eyebrow="02 · Tokens" title="Color Tokens & Semantic Contrast Matrix"
          intro="A traffic-light semantic core (Emerald → Amber → Crimson) plus Pause Indigo as the calm, brand-owned alternative state. Click any swatch to copy its hex.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((c) => <Swatch key={c.hex} c={c} />)}
          </div>
          <ContrastMatrix />
        </Section>

        <Section id="type" eyebrow="03 · Typography" title="Typography Scale"
          intro="Three families, three jobs: authority, readability, and temporal precision.">
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {[
              { fam: "Plus Jakarta Sans", role: "Headings · Display", cls: "font-display font-extrabold text-5xl tracking-tight", sample: "Class is on. Leave now.", spec: "48 / 1.05 / 800" },
              { fam: "Plus Jakarta Sans", role: "H3 · Card titles", cls: "font-display font-bold text-2xl", sample: "Reschedule Data Structures", spec: "24 / 1.3 / 700" },
              { fam: "Inter", role: "Micro-learning body", cls: "font-sans text-base leading-relaxed max-w-2xl", sample: "A binary search tree keeps every left child smaller than its parent and every right child larger, so each comparison halves the remaining search space.", spec: "16 / 1.65 / 400" },
              { fam: "Inter", role: "Caption · Meta", cls: "font-sans text-xs text-slate-500", sample: "Data Structures · Dr. Rahman · R.204", spec: "12 / 1.4 / 400" },
              { fam: "JetBrains Mono", role: "Live SLA countdown · tabular-nums", cls: "font-mono font-bold text-5xl tabular-nums", sample: <LiveMono />, spec: "48 / 1 / 700 · tnum" },
            ].map((t, i) => (
              <div key={i} className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                <div>
                  <p className="font-display font-semibold">{t.fam}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                  <p className="mt-2 font-mono text-xs text-slate-400">{t.spec}</p>
                </div>
                <div className={t.cls}>{t.sample}</div>
              </div>
            ))}
          </div>
          <Rationale>
            <code className="font-mono">tabular-nums</code> gives every digit an identical width, so a ticking timer never
            jitters horizontally. Motion in peripheral vision triggers involuntary attention; a stable timer stays calm.
          </Rationale>
        </Section>

        <Section id="patterns" eyebrow="04 · Components" title="Interactive Core Component Patterns"
          intro="Live, interactive reference implementations. Every pattern maps to one principle.">
          <PatternFrame label="Pattern A" title="Commute Radar Cards"
            rationale={<><strong>Pre-attentive processing.</strong> The top color bar and status chip are read peripherally before any text. Each state pairs hue + icon + verb so meaning survives color blindness and glare.</>}>
            <CommuteRadar />
          </PatternFrame>
          <PatternFrame label="Pattern B" title="Hick's Law 3-Option Slot Selector"
            rationale={<><strong>Hick's Law & cognitive offloading.</strong> The engine evaluates every slot against room and student timetables and surfaces only the top 3. Decision time drops from minutes of calendar browsing to a single tap, with a pre-selected default.</>}>
            <SlotSelector />
          </PatternFrame>
          <PatternFrame label="Pattern C" title="Zeigarnik Micro-Pause Stepper & Verified Attendance Badge"
            rationale={<><strong>Zeigarnik effect.</strong> The open ring and the locked receipt create productive incompleteness. Finishing closes the loop and mints a timestamped attendance record. Press Resume to watch it convert.</>}>
            <MicroPause />
          </PatternFrame>
          <PatternFrame label="Pattern D" title="Thumb-Zone Mobile Bottom Sheet"
            rationale={<><strong>Fitts's Law.</strong> Primary actions sit in the natural thumb arc with large targets, minimizing movement time for one-handed use while standing on public transport.</>}>
            <ThumbZone />
          </PatternFrame>
        </Section>
      </main>

    </div>
  );
}

function LiveMono() {
  const s = useCountdown(14 * 60 + 59);
  return <span>{fmt(s)}</span>;
}
