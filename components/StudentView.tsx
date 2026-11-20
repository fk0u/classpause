"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, Coffee, MapPin, ShieldCheck, Timer, Play, X, Check, BadgeCheck, FileHeart, ChevronRight, CalendarClock, Video, WifiOff,
} from "lucide-react";
import { useDemo, fmt, SLA_SECONDS, type ClassStatus, type Receipt } from "./demo-state";

type Tone = "go" | "hold" | "pause" | "info";
const TONE: Record<Tone, { bar: string; chip: string; surface: string; text: string; border: string }> = {
  go: { bar: "bg-emerald", chip: "bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]", surface: "bg-[#ECFDF5]", text: "text-[#065F46]", border: "border-[#6EE7B7]" },
  hold: { bar: "bg-amber", chip: "bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]", surface: "bg-[#FFFBEB]", text: "text-[#92400E]", border: "border-[#FCD34D]" },
  pause: { bar: "bg-gradient-to-r from-crimson to-indigo", chip: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]", surface: "bg-[#FEF2F2]", text: "text-[#991B1B]", border: "border-[#FCA5A5]" },
  info: { bar: "bg-indigo", chip: "bg-indigo/10 text-indigo border-indigo/30", surface: "bg-indigo/5", text: "text-indigo", border: "border-indigo/30" },
};

function ClassCard({ tone, icon: Icon, badge, title, time, room, children }: {
  tone: Tone; icon: React.ElementType; badge: string; title: string; time: string; room: string; children?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 ${t.bar}`} />
      <div className="p-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${t.chip}`}>
          <Icon size={13} /> {badge}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug">{title}</h3>
        <p className="mt-0.5 flex items-center gap-3 text-sm text-slate-500">
          <span className="font-mono tabular-nums">{time}</span>
          <span className="flex items-center gap-1"><MapPin size={13} /> {room}</span>
        </p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </article>
  );
}

function Card2({ status, sla, onStart }: { status: ClassStatus; sla: number; onStart: () => void }) {
  const { lockedSlot } = useDemo();
  const base = { title: "Digital Systems & Logic", time: "10:00–11:40", room: "A-102" };
  if (status === "confirmed")
    return <ClassCard tone="go" icon={CheckCircle2} badge="Safe to commute" {...base}>
      <p className="text-sm text-[#065F46]">Verified by Dr. Naufal just now · leave by 09:30</p></ClassCard>;
  if (status === "delayed")
    return <ClassCard tone="info" icon={Video} badge="Delayed 20 min · Online" {...base} time="10:20–12:00" room="Online">
      <p className="text-sm text-indigo">Stay where you are. Join link opens at 10:15.</p></ClassCard>;
  if (status === "reschedule")
    return <ClassCard tone="hold" icon={CalendarClock} badge="Hold · Rescheduling" {...base}>
      <p className="text-sm text-[#92400E]">Lecturer requested a new slot. Komti is choosing from 3 conflict-free options. Don&apos;t commute.</p></ClassCard>;
  if (status === "rescheduled" && lockedSlot)
    return <ClassCard tone="go" icon={CalendarClock} badge="Rescheduled · No commute today" {...base} time={`${lockedSlot.day.slice(0, 3)} ${lockedSlot.time}`} room={lockedSlot.room}>
      <p className="text-sm text-[#065F46]">{lockedSlot.meta}. Added to your calendar.</p></ClassCard>;
  if (status === "micropause")
    return <ClassCard tone="pause" icon={Coffee} badge="Do not commute · Micro-Pause" {...base}>
      <button onClick={onStart} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo text-sm font-semibold text-white">
        <Play size={16} /> Start 15-Min Micro-Pause
      </button></ClassCard>;
  if (status === "idle")
    return <ClassCard tone="info" icon={Clock} badge="Awaiting H-2h check" {...base} />;
  // pending
  return <ClassCard tone="hold" icon={Clock} badge="Hold commute" {...base}>
    <div className={`rounded-xl border ${TONE.hold.border} ${TONE.hold.surface} p-3`}>
      <div className="flex items-baseline justify-between text-sm text-[#92400E]">
        <span>Auto-Pause SLA in</span>
        <span className="font-mono text-2xl font-bold tabular-nums text-navy">{fmt(sla)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber/20">
        <div className="h-full bg-amber transition-all duration-1000 ease-linear" style={{ width: `${(sla / SLA_SECONDS) * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-[#92400E]">Awaiting lecturer 1-tap confirmation.</p>
    </div>
  </ClassCard>;
}

/* ---------- Micro-Pause drawer (3-step Zeigarnik stepper) ---------- */

const QUIZ = [
  { q: "Which gate outputs 1 only when all inputs are 1?", a: ["OR", "AND", "XOR"], c: 1 },
  { q: "How many rows does a 3-input truth table have?", a: ["6", "8", "9"], c: 1 },
  { q: "NAND is called a universal gate because…", a: ["It is the fastest gate", "Any logic function can be built from it", "It has 3 inputs"], c: 1 },
];

function MicroPauseDrawer({ course, onClose }: { course: string; onClose: () => void }) {
  const { addReceipt } = useDemo();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const allAnswered = answers.every((a) => a !== null);
  const score = answers.filter((a, i) => a === QUIZ[i].c).length;

  const next = () => {
    if (step < 2) setStep(step + 1);
    else setReceipt(addReceipt(course, `${score}/3`));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo">Micro-Pause · 15 min</p>
            <p className="font-display font-bold">{course}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-12 w-12 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>

        {/* segmented progress */}
        <div className="flex gap-1.5 px-5 pt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition ${receipt || i < step ? "bg-emerald" : i === step ? "bg-indigo" : "bg-slate-200"}`} />
          ))}
        </div>
        <p className="px-5 pt-1.5 text-xs text-slate-500">{receipt ? "Complete" : `Step ${step + 1}/3 · ${["Concept summary", "Key diagram & takeaways", "3-question quick check"][step]}`}
          <span className="float-right flex items-center gap-1"><WifiOff size={11} /> Works offline</span></p>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-[15px] leading-relaxed">
          {receipt ? (
            <div className="rounded-2xl border-2 border-dashed border-emerald bg-[#ECFDF5] p-5">
              <div className="flex items-center gap-2 text-[#065F46]"><BadgeCheck /> <p className="font-display text-lg font-bold">Attendance Verified via Micro-Pause</p></div>
              <dl className="mt-4 space-y-1.5 font-mono text-xs">
                {[["Receipt", receipt.id], ["Student", "Raka · Informatics '26"], ["Course", receipt.course], ["Quiz", receipt.score], ["Timestamp", receipt.at]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right tabular-nums">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-[#065F46]">Simulated sync to Komti dashboard. SIAKAD integration is planned, not built.</p>
            </div>
          ) : step === 0 ? (
            <div className="space-y-3">
              <h4 className="font-display text-lg font-bold">Logic gates in 3 minutes</h4>
              <p>Digital circuits make decisions with <strong>logic gates</strong>. Each gate takes binary inputs (0 or 1) and produces one output.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>AND</strong> outputs 1 only if every input is 1.</li>
                <li><strong>OR</strong> outputs 1 if at least one input is 1.</li>
                <li><strong>NOT</strong> flips its input.</li>
              </ul>
              <p>A <strong>truth table</strong> lists every input combination: <em>n</em> inputs give 2<sup>n</sup> rows.</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-3">
              <h4 className="font-display text-lg font-bold">Truth table: AND vs NAND</h4>
              <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-center font-mono text-sm">
                <thead className="bg-slate-50"><tr><th className="py-1.5">A</th><th>B</th><th>AND</th><th>NAND</th></tr></thead>
                <tbody>{[[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => (
                  <tr key={`${a}${b}`} className="border-t border-slate-100"><td className="py-1.5">{a}</td><td>{b}</td><td>{a & b}</td><td className="text-indigo font-bold">{1 - (a & b)}</td></tr>
                ))}</tbody>
              </table>
              <div className="rounded-xl bg-indigo/5 p-3 text-sm"><strong className="text-indigo">Takeaway:</strong> NAND alone can build AND, OR and NOT, which is why chips are often made only of NAND gates.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {QUIZ.map((q, i) => (
                <fieldset key={i}>
                  <legend className="mb-2 text-sm font-semibold">{i + 1}. {q.q}</legend>
                  <div className="grid gap-1.5">
                    {q.a.map((opt, j) => (
                      <button key={j} onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))}
                        className={`min-h-12 rounded-xl border-2 px-3 text-left text-sm ${answers[i] === j ? "border-indigo bg-indigo/5 font-semibold" : "border-slate-200"}`}>{opt}</button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          {receipt ? (
            <button onClick={onClose} className="min-h-12 w-full rounded-xl bg-navy font-semibold text-white">Done</button>
          ) : (
            <button onClick={next} disabled={step === 2 && !allAnswered}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo font-semibold text-white disabled:opacity-40">
              {step < 2 ? <>Next step <ChevronRight size={18} /></> : <><Check size={18} /> Submit & log attendance</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Leave sheet ---------- */

function LeaveSheet({ onClose }: { onClose: () => void }) {
  const { submitPermission } = useDemo();
  const [type, setType] = useState<"Sick" | "Dispensation">("Sick");
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-5">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" />
        <p className="font-display text-lg font-bold">One-door leave request</p>
        <p className="text-sm text-slate-500">Goes to your Komti and lecturer at once. No chat needed.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["Sick", "Dispensation"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`min-h-12 rounded-xl border-2 font-semibold ${type === t ? "border-indigo bg-indigo/5 text-indigo" : "border-slate-200"}`}>{t}</button>
          ))}
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note (optional)"
          className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo" />
        <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">Proof upload (simulated, nothing is stored)</div>
        <button onClick={() => { submitPermission(type, note); onClose(); }} className="mt-4 min-h-12 w-full rounded-xl bg-navy font-semibold text-white">Submit request</button>
      </div>
    </div>
  );
}

/* ---------- View ---------- */

export default function StudentView() {
  const { status, sla, recoveredMin, receipts } = useDemo();
  const [drawer, setDrawer] = useState<string | null>(null);
  const [leave, setLeave] = useState(false);
  const firstPause = status === "micropause" ? "Digital Systems & Logic" : "Operating Systems";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Hi, Raka — Informatics &apos;26</p>
          <h1 className="font-display text-2xl font-bold">Today&apos;s Commute Radar</h1>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-[#065F46]"><ShieldCheck size={14} /> Protected</span>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-navy p-4 text-white">
        <Timer className="text-amber" />
        <div className="flex-1">
          <p className="font-mono text-2xl font-bold tabular-nums">{recoveredMin} min</p>
          <p className="text-xs text-slate-300">dead-time recovered this semester (simulated)</p>
        </div>
      </div>

      <ClassCard tone="go" icon={CheckCircle2} badge="Safe to commute" title="Algorithms & Data Structures" time="08:00–09:40" room="B-204">
        <p className="text-sm text-[#065F46]">Verified by Dr. Naufal at 06:15</p>
      </ClassCard>
      <Card2 status={status} sla={sla} onStart={() => setDrawer("Digital Systems & Logic")} />
      <ClassCard tone="pause" icon={Coffee} badge="Do not commute · Micro-Pause" title="Operating Systems" time="13:00–14:40" room="C-310">
        <p className="text-sm text-[#991B1B]">Lecturer did not confirm by H+15m. Switched to asynchronous Micro-Pause.</p>
      </ClassCard>

      {receipts.length > 0 && (
        <section>
          <h2 className="mb-2 font-display font-bold">Attendance receipts</h2>
          {receipts.map((r) => (
            <div key={r.id} className="mb-2 flex items-center gap-3 rounded-xl border border-[#6EE7B7] bg-[#ECFDF5] p-3 text-sm">
              <BadgeCheck className="text-emerald" size={20} />
              <div className="flex-1"><p className="font-semibold">{r.course}</p><p className="font-mono text-xs text-slate-500">{r.id} · {r.at} · Quiz {r.score}</p></div>
            </div>
          ))}
        </section>
      )}

      {/* Thumb-zone bottom action anchor */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto grid max-w-md gap-2">
          <button onClick={() => setDrawer(firstPause)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo font-semibold text-white">
            <Play size={16} /> Start 15-Min Micro-Pause & Log Attendance
          </button>
          <button onClick={() => setLeave(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold">
            <FileHeart size={16} /> Submit sick / dispensation
          </button>
        </div>
      </div>

      {drawer && <MicroPauseDrawer course={drawer} onClose={() => setDrawer(null)} />}
      {leave && <LeaveSheet onClose={() => setLeave(false)} />}
    </div>
  );
}
