"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { SessionStatus } from "@/db/schema";
import { STATUS, TONE } from "./status";
import { fmtRange, localParts } from "@/lib/time";
import { useT } from "@/lib/i18n/client";

type Item = { id: string; title: string; sub: string; startsAt: Date | string; endsAt: Date | string; status: SessionStatus };

const START = 7 * 60;   // 07:00
const END = 19 * 60;    // 19:00
const PX_PER_MIN = 0.9;

/** Vertical day calendar like the reference: hour rail, coloured blocks, a red "now" line. */
export default function DayTimeline({ items }: { items: Item[] }) {
  const [now, setNow] = useState<number | null>(null);
  const t = useT();
  useEffect(() => {
    const t = () => setNow(localParts(new Date()).minutes);
    t();
    const i = setInterval(t, 30_000);
    return () => clearInterval(i);
  }, []);

  const y = (min: number) => (Math.min(Math.max(min, START), END) - START) * PX_PER_MIN;
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);

  return (
    <div className="relative rounded-[28px] bg-white p-4">
      <div className="relative" style={{ height: (END - START) * PX_PER_MIN }}>
        {hours.map((h) => (
          <div key={h} className="absolute inset-x-0 flex items-center gap-2" style={{ top: y(h * 60) - 7 }}>
            <span className="w-10 text-right font-mono text-[11px] text-slate-400">{String(h).padStart(2, "0")}:00</span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
        ))}

        {items.map((it, i) => {
          const a = localParts(new Date(it.startsAt)).minutes;
          const b = localParts(new Date(it.endsAt)).minutes;
          const st = STATUS[it.status];
          return (
            <motion.div key={it.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className={`absolute left-14 right-0 overflow-hidden rounded-2xl border p-2.5 ${TONE[st.tone].block}`}
              style={{ top: y(a) + 1, height: Math.max(y(b) - y(a) - 3, 34) }}>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink/50">{st.emoji} {t.status[it.status].label}</p>
              <p className="truncate font-display text-sm font-semibold leading-tight">{it.title}</p>
              <p className="truncate font-mono text-[11px] text-ink/50">{fmtRange(it.startsAt, it.endsAt)} · {it.sub}</p>
            </motion.div>
          );
        })}

        {now !== null && now >= START && now <= END && (
          <div className="absolute left-12 right-0 flex items-center" style={{ top: y(now) }}>
            <span className="h-2.5 w-2.5 rounded-full bg-crimson" />
            <span className="h-0.5 flex-1 bg-crimson/80" />
          </div>
        )}
      </div>
    </div>
  );
}
