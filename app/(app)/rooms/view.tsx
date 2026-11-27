"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DoorOpen, Users, Sparkles, Loader2, X, Check, Megaphone, ThumbsUp, PenLine, Projector, Wind, Trash2, CircleParking, CircleHelp } from "lucide-react";
import type { OpenSlot } from "@/lib/rooms";
import { claimRoomAction, releaseRoomAction, reportFacilityAction, resolveReportAction } from "@/app/actions";
import { useLive } from "@/components/live";
import { useT, fmt, tr } from "@/lib/i18n/client";
import { fmtRange, fmtTime } from "@/lib/time";

type Report = { id: string; place: string; kind: keyof typeof ICON; confirms: number; createdAt: Date | string };
const ICON = { marker: PenLine, projector: Projector, ac: Wind, cleanliness: Trash2, parking_full: CircleParking, other: CircleHelp } as const;

export default function RoomsView({ slots, reports, places, canResolve }: { slots: OpenSlot[]; reports: Report[]; places: string[]; canResolve: boolean }) {
  const t = useT();
  const { toast } = useLive();
  const [claiming, setClaiming] = useState<OpenSlot | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    start(async () => { const r = await fn(); if (!r.ok) toast(r.error ?? "Error", "warn"); else if (okMsg) toast(okMsg, "ok"); });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.rooms.title}</h1>
        <p className="mt-1 text-slate-500">{t.rooms.lead}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {slots.map((o, i) => (
            <motion.li key={o.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
              className={`flex flex-col gap-3 rounded-[28px] p-4 sm:p-5 ${o.freedFrom ? "bg-lilac" : "bg-white"}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${o.freedFrom ? "bg-white" : "bg-paper"}`}><DoorOpen size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-semibold leading-tight">{o.roomCode}</p>
                  <p className="font-mono text-sm text-ink/60">{fmtRange(o.startsAt, o.endsAt)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50"><Users size={12} /> {fmt(t.rooms.seats, { n: o.capacity })} · {o.building}</p>
                </div>
              </div>
              {o.freedFrom && <p className="flex items-center gap-1.5 text-sm font-medium text-lilac-deep"><Sparkles size={14} /> {fmt(t.rooms.freed, { course: o.freedFrom })}</p>}
              {o.claim ? (
                <div className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-sm">
                  <span className="min-w-0 flex-1"><b>{o.claim.mine ? t.rooms.mine : fmt(t.rooms.claimed, { name: o.claim.by })}</b><span className="block truncate text-ink/60">{o.claim.purpose}</span></span>
                  {o.claim.mine && <button disabled={pending} onClick={() => run(() => releaseRoomAction(o.claim!.id))} className="min-h-10 rounded-full bg-paper px-3 font-semibold">{t.rooms.release}</button>}
                </div>
              ) : (
                <button onClick={() => setClaiming(o)} className="min-h-11 rounded-full bg-ink font-semibold text-white">{t.rooms.claim}</button>
              )}
            </motion.li>
          ))}
          {slots.length === 0 && <li className="rounded-[28px] border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 sm:col-span-2">{t.rooms.none}</li>}
        </ul>
      </section>

      <aside className="space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
        <ReportForm places={places} />
        <div>
          <h2 className="font-display text-2xl font-semibold">{t.rooms.openReports}</h2>
          <ul className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {reports.map((r) => {
                const Icon = ICON[r.kind] ?? CircleHelp;
                return (
                  <motion.li key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl p-3 ${r.kind === "parking_full" ? "bg-butter" : "bg-white"}`}>
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 text-sm"><b>{r.place}</b> · {t.rooms.kinds[r.kind]}<span className="block text-xs text-ink/50">{fmt(t.rooms.confirms, { n: r.confirms })} · {fmtTime(r.createdAt)}</span></span>
                    <span className="flex gap-1.5">
                      <button disabled={pending} onClick={() => run(() => reportFacilityAction({ place: r.place, kind: r.kind }))} className="flex min-h-10 items-center gap-1 rounded-full bg-paper px-3 text-xs font-semibold"><ThumbsUp size={13} /> {t.rooms.meToo}</button>
                      {canResolve && <button disabled={pending} onClick={() => run(() => resolveReportAction(r.id))} className="flex min-h-10 items-center gap-1 rounded-full bg-mint px-3 text-xs font-semibold"><Check size={13} /> {t.rooms.fixed}</button>}
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {reports.length === 0 && <li className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">{t.rooms.noReports}</li>}
          </ul>
        </div>
      </aside>

      <AnimatePresence>{claiming && <ClaimSheet slot={claiming} onClose={() => setClaiming(null)} />}</AnimatePresence>
    </div>
  );

  function ReportForm({ places }: { places: string[] }) {
    const [place, setPlace] = useState(places[0]);
    return (
      <section className="rounded-[28px] bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Megaphone size={18} /> {t.rooms.reportTitle}</h2>
        <p className="text-sm text-slate-500">{t.rooms.reportLead}</p>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="place">{t.rooms.place}</label>
        <select id="place" value={place} onChange={(e) => setPlace(e.target.value)} className="mt-1 min-h-11 w-full rounded-full bg-paper px-4 text-[15px]">
          {places.map((p) => <option key={p}>{p}</option>)}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(ICON) as (keyof typeof ICON)[]).filter((k) => place.startsWith("Parking") ? k === "parking_full" || k === "other" : k !== "parking_full").map((k) => {
            const Icon = ICON[k];
            return (
              <button key={k} disabled={pending} onClick={() => run(() => reportFacilityAction({ place, kind: k }), t.rooms.reported)}
                className="flex min-h-12 items-center gap-2 rounded-2xl bg-paper px-3 text-left text-sm font-medium hover:bg-butter">
                <Icon size={16} className="shrink-0" /> {t.rooms.kinds[k]}
              </button>
            );
          })}
        </div>
      </section>
    );
  }
}

function ClaimSheet({ slot, onClose }: { slot: OpenSlot; onClose: () => void }) {
  const t = useT();
  const { toast } = useLive();
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal aria-label={t.rooms.confirm} onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-xl rounded-t-[32px] bg-paper p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl sm:p-6">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-display text-2xl font-semibold">{slot.roomCode}</h2><p className="font-mono text-sm text-slate-500">{fmtRange(slot.startsAt, slot.endsAt)}</p></div>
          <button onClick={onClose} aria-label={t.common.close} className="rounded-full bg-white p-2"><X size={18} /></button>
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="purpose">{t.rooms.purpose}</label>
        <input id="purpose" value={purpose} maxLength={80} onChange={(e) => { setPurpose(e.target.value); setError(null); }} placeholder={t.rooms.purposePh}
          className="mt-1 min-h-12 w-full rounded-full border-2 border-transparent bg-white px-4 text-[16px] outline-none focus:border-ink" />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button disabled={pending} onClick={() => start(async () => {
          const r = await claimRoomAction({ roomId: slot.roomId, startsAt: slot.startsAt, purpose });
          if (r.ok) { toast(t.rooms.mine, "ok"); onClose(); } else setError(tr(t, r.error));
        })} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white disabled:opacity-50">
          {pending && <Loader2 size={16} className="animate-spin" />} {t.rooms.confirm}
        </button>
      </motion.div>
    </motion.div>
  );
}
