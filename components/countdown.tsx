"use client";

import { useEffect, useState } from "react";

export function useRemaining(deadline: Date | string | null | undefined) {
  const target = deadline ? new Date(deadline).getTime() : 0;
  // null until mounted so server HTML and first client render match (no hydration mismatch).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (now === null) return null;
  return target ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
}

export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Circular SLA ring: drains as the 15-minute window runs out. */
export function SlaRing({ deadline, total = 15 * 60, size = 64 }: { deadline: Date | string | null; total?: number; size?: number }) {
  const remaining = useRemaining(deadline);
  const left = remaining ?? total;
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, left / total);
  const urgent = left < 120;
  return (
    <div className="relative" style={{ width: size, height: size }} role="timer" aria-label={`${mmss(left)} left before Micro-Pause`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-black/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke={urgent ? "#EF4444" : "#F59E0B"} strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-mono text-[13px] font-bold tabular-nums ${urgent ? "text-red-600" : "text-amber-800"}`}>{remaining === null ? "--:--" : mmss(left)}</span>
    </div>
  );
}
