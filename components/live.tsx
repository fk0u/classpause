"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Radio, X } from "lucide-react";
import { useT, fmt, tr } from "@/lib/i18n/client";

type Toast = { id: number; text: string; tone: "ok" | "warn" | "info"; href?: string };
type Ctx = { toast: (text: string, tone?: Toast["tone"], href?: string) => void; connected: boolean };

const LiveCtx = createContext<Ctx>({ toast: () => {}, connected: false });
export const useLive = () => useContext(LiveCtx);

/** Subscribes to /api/stream, refreshes server data on every change, and shows toasts. */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connected, setConnected] = useState(false);
  const tid = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;

  const toast = useCallback((raw: string, tone: Toast["tone"] = "info", href?: string) => {
    const text = tr(tRef.current, raw);
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone, href }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), href ? 12000 : 4500);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        // Translate on the client so every viewer sees their own language.
        const n = (tRef.current.notif as Record<string, unknown>)[e.kind] as { title: string; body: string } | undefined;
        if (e.type !== "inbox" && e.type !== "room") toast(n ? `${n.title}${e.vars?.course ? ` · ${e.vars.course}` : ""}` : e.message, e.tone);
      } catch { /* ignore */ }
      // Coalesce bursts of events into one server refresh.
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 150);
    };
    return () => es.close();
  }, [router, toast]);

  return (
    <LiveCtx.Provider value={{ toast, connected }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div key={t.id} layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-3xl px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl ${
                t.tone === "ok" ? "bg-mint text-ink ring-1 ring-mint-deep/20" : t.tone === "warn" ? "bg-butter text-ink ring-1 ring-butter-deep/20" : "bg-ink text-white"}`}>
              {t.tone === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : t.tone === "warn" ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <Radio size={18} className="mt-0.5 shrink-0" />}
              <span className="flex-1">
                {t.text}
                {t.href && <a href={t.href} target="_blank" rel="noreferrer" className="mt-1 block truncate underline underline-offset-2 opacity-90">{t.href}</a>}
              </span>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss" className="opacity-70 hover:opacity-100"><X size={16} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </LiveCtx.Provider>
  );
}

export function LiveDot() {
  const { connected } = useLive();
  const t = useT();
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60" title={connected ? "Live updates connected" : "Reconnecting…"}>
      <span className="relative flex h-2 w-2">
        {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald" : "bg-slate-300"}`} />
      </span>
      {connected ? t.common.live : t.common.offline}
    </span>
  );
}
