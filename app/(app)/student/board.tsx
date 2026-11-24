"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, User2, Coffee, FileHeart, BadgeCheck, CalendarClock, Navigation, Hourglass } from "lucide-react";
import type { getStudentView } from "@/lib/queries";
import { STATUS, TONE_CLASSES } from "@/components/status";
import { SlaRing } from "@/components/countdown";
import { fmtRange, fmtDay } from "@/lib/time";
import MicroPause from "./micro-pause";
import LeaveSheet from "./leave-sheet";

type View = Awaited<ReturnType<typeof getStudentView>>;
type Ses = View["sessions"][number];

export default function StudentBoard({ firstName, sessions, completedPauses }: View & { firstName: string }) {
  const [pause, setPause] = useState<Ses | null>(null);
  const [leave, setLeave] = useState<Ses | null>(null);

  const safe = sessions.filter((x) => x.status === "confirmed").length;
  const hold = sessions.filter((x) => ["pending", "scheduled", "delayed"].includes(x.status)).length;
  const freed = sessions.filter((x) => ["micropause", "rescheduled"].includes(x.status)).length;

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-navy p-6 text-white shadow-2xl shadow-indigo/20">
        <div aria-hidden className="aurora absolute inset-0 opacity-70" />
        <div className="relative">
          <p className="text-sm text-indigo-200">Hi {firstName} · {fmtDay(new Date())}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Today’s Commute Radar</h1>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
            {[
              { k: "Safe to go", v: safe, c: "text-emerald-300" },
              { k: "On hold", v: hold, c: "text-amber-300" },
              { k: "Freed up", v: freed, c: "text-indigo-300" },
            ].map((m) => (
              <div key={m.k} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <p className={`font-mono text-3xl font-bold tabular-nums ${m.c}`}>{m.v}</p>
                <p className="text-[11px] text-slate-300">{m.k}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">{completedPauses} Micro-Pause module{completedPauses === 1 ? "" : "s"} completed this semester</p>
        </div>
      </motion.section>

      {sessions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No classes today. Enjoy the free day.</div>
      )}

      <motion.ul layout className="space-y-4">
        <AnimatePresence>
          {sessions.map((x, i) => <SessionCard key={x.id} x={x} i={i} onPause={() => setPause(x)} onLeave={() => setLeave(x)} />)}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>{pause && pause.module && <MicroPause session={pause} onClose={() => setPause(null)} />}</AnimatePresence>
      <AnimatePresence>{leave && <LeaveSheet session={leave} onClose={() => setLeave(null)} />}</AnimatePresence>
    </div>
  );
}

function SessionCard({ x, i, onPause, onLeave }: { x: Ses; i: number; onPause: () => void; onLeave: () => void }) {
  const st = STATUS[x.status];
  const tone = TONE_CLASSES[st.tone];
  const canPause = x.status === "micropause" && x.module && !x.receipt;
  return (
    <motion.li layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg ${tone.glow}`}>
      <motion.div layoutId={`bar-${x.id}`} className={`h-1.5 ${tone.bar}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <motion.span key={x.status} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone.chip}`}>
              {x.status === "confirmed" ? <Navigation size={12} /> : x.status === "pending" ? <Hourglass size={12} /> : x.status === "micropause" ? <Coffee size={12} /> : <CalendarClock size={12} />}
              {st.label}
            </motion.span>
            <h2 className="mt-2 font-display text-lg font-bold leading-snug">{x.klass.name}</h2>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-slate-500">
              <span>{fmtRange(x.startsAt, x.endsAt)}{x.delayMinutes ? ` +${x.delayMinutes}m` : ""}</span>
              <span className="flex items-center gap-1"><MapPin size={12} />{x.room.code}</span>
              <span className="flex items-center gap-1 font-sans"><User2 size={12} />{x.klass.lecturerName}</span>
            </p>
          </div>
          {x.status === "pending" && <SlaRing deadline={x.slaDeadline} />}
        </div>

        <p className={`mt-3 text-sm ${tone.text}`}>{st.advice}</p>

        {x.status === "rescheduled" && x.lockedSlot?.startsAt && (
          <div className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm text-indigo-900">
            <span className="font-semibold">New slot:</span> {fmtDay(x.lockedSlot.startsAt)} · {fmtRange(x.lockedSlot.startsAt, x.lockedSlot.endsAt!)} · {x.lockedSlot.roomCode}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {canPause && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onPause}
              className="shine flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo px-4 font-semibold text-white shadow-lg shadow-indigo/30">
              <Coffee size={18} /> Start 15-min Micro-Pause
            </motion.button>
          )}
          {x.receipt && (
            <span className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">
              <BadgeCheck size={18} /> Attendance logged · {x.receipt.code} · {x.receipt.correct}/{x.receipt.total}
            </span>
          )}
          {x.permission ? (
            <span className="flex min-h-12 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-600">
              <FileHeart size={16} /> {x.permission.type === "sick" ? "Sick" : "Dispensation"}: {x.permission.status}
            </span>
          ) : !x.receipt && (
            <button onClick={onLeave} className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FileHeart size={16} /> Request leave
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
