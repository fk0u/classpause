"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import type { getWeekly } from "@/lib/queries";
import { AvatarStack } from "@/components/avatar";
import { useT } from "@/lib/i18n/client";
import { localParts, minToHHMM } from "@/lib/time";

type M = Awaited<ReturnType<typeof getWeekly>>[number];

const START = 7 * 60, END = 18 * 60 + 30, PX = 1.1;
const COLORS = ["bg-lilac", "bg-sky", "bg-butter", "bg-mint", "bg-rose"];

/** Week grid like the reference task board: days across, hours down, a "now" line. */
export default function WeekView({ meetings }: { meetings: M[] }) {
  const t = useT();
  const [now, setNow] = useState<{ day: number; min: number } | null>(null);
  const [pick, setPick] = useState(1);
  useEffect(() => { const p = localParts(new Date()); setNow({ day: p.day, min: p.minutes }); setPick(p.day > 6 ? 1 : p.day); }, []);

  const classIds = [...new Set(meetings.map((m) => m.classId))];
  const color = (id: string) => COLORS[classIds.indexOf(id) % COLORS.length];
  const days = [1, 2, 3, 4, 5, 6];
  const hours = Array.from({ length: Math.floor((END - START) / 60) + 1 }, (_, i) => START / 60 + i);
  const y = (m: number) => (m - START) * PX;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.schedule.title}</h1>
      <p className="mt-1 text-slate-500">{t.schedule.lead}</p>

      {/* Phones: one day at a time. */}
      <div className="mt-6 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
          {days.map((d) => (
            <button key={d} role="tab" aria-selected={pick === d} onClick={() => setPick(d)}
              className={`min-h-11 min-w-12 flex-1 rounded-full px-3 text-sm font-semibold ${pick === d ? "bg-ink text-white" : "bg-white text-slate-600"}`}>
              {t.schedule.days[d - 1]}{now?.day === d ? " •" : ""}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-3">
          {meetings.filter((m) => m.day === pick).sort((a, b) => a.startMin - b.startMin).map((m) => (
            <li key={m.id} className={`flex items-center gap-4 rounded-[24px] p-4 ${color(m.classId)}`}>
              <div className="w-16 shrink-0 font-mono text-sm font-semibold">{minToHHMM(m.startMin)}<span className="block text-xs font-normal text-ink/50">{minToHHMM(m.endMin)}</span></div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold leading-tight">{m.className}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60"><MapPin size={11} />{m.room} · {m.lecturerName}</p>
              </div>
            </li>
          ))}
          {meetings.filter((m) => m.day === pick).length === 0 && <li className="rounded-[24px] border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">—</li>}
        </ul>
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-[28px] bg-white p-4 md:block">
        <div className="grid min-w-[760px] grid-cols-[52px_repeat(6,1fr)] gap-2">
          <div />
          {days.map((d) => (
            <div key={d} className={`rounded-2xl py-2 text-center text-sm font-semibold ${now?.day === d ? "bg-ink text-white" : "text-slate-500"}`}>{t.schedule.days[d - 1]}</div>
          ))}

          <div className="relative" style={{ height: y(END) }}>
            {hours.map((h) => <span key={h} className="absolute right-1 font-mono text-[11px] text-slate-400" style={{ top: y(h * 60) - 7 }}>{String(h).padStart(2, "0")}:00</span>)}
          </div>
          {days.map((d) => (
            <div key={d} className={`relative rounded-2xl ${now?.day === d ? "hatch bg-paper" : ""}`} style={{ height: y(END) }}>
              {hours.map((h) => <span key={h} className="absolute inset-x-0 h-px bg-slate-100" style={{ top: y(h * 60) }} />)}
              {meetings.filter((m) => m.day === d).map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className={`absolute inset-x-1 overflow-hidden rounded-2xl p-2.5 ${color(m.classId)}`}
                  style={{ top: y(m.startMin) + 1, height: y(m.endMin) - y(m.startMin) - 2 }}>
                  <AvatarStack names={[m.lecturerName]} size={22} />
                  <p className="mt-1.5 line-clamp-2 font-display text-sm font-semibold leading-tight">{m.className}</p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-ink/60"><MapPin size={10} />{m.room} · {minToHHMM(m.startMin)}</p>
                </motion.div>
              ))}
              {now && now.day === d && now.min > START && now.min < END && (
                <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: y(now.min) }}>
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo" /><span className="h-0.5 flex-1 bg-indigo" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
