"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock, Radio, Coffee, Loader2, X, MapPin, Sparkles, Pin, Thermometer, Trophy } from "lucide-react";
import type { getKomtiView } from "@/lib/queries";
import { lockSlotAction } from "@/app/actions";
import PermissionQueue from "@/components/permission-queue";
import { PhotoCard, AttendancePanel, ChangeRequests } from "@/components/session-tools";
import { STATUS, TONE } from "@/components/status";
import { SlaRing } from "@/components/countdown";
import { Avatar } from "@/components/avatar";
import { useLive } from "@/components/live";
import { fmtRange, fmtDay, fmtTime } from "@/lib/time";
import { PageHero } from "@/components/page-hero";
import { useT, fmt } from "@/lib/i18n/client";

type View = Awaited<ReturnType<typeof getKomtiView>>;

export default function KomtiConsole({ sessions, permissions, feed, changes }: View) {
  const pendingPerms = permissions.filter((p) => p.status === "pending");
  const timers = sessions.filter((x) => x.status === "pending");
  const resched = sessions.find((x) => x.status === "reschedule");
  const receipts = sessions.reduce((n, x) => n + x.receipts, 0);
  const t = useT();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <PageHero kicker={t.komti.kicker} title={t.komti.title} />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: sessions.length, k: t.komti.statClasses, c: "bg-sky" },
            { n: timers.length, k: t.komti.statTimers, c: "bg-butter" },
            { n: pendingPerms.length, k: t.komti.statRequests, c: "bg-lilac" },
            { n: receipts, k: t.komti.statPauses, c: "bg-mint" },
          ].map((m) => (
            <div key={m.k} className={`rounded-[24px] p-4 text-center ${m.c}`}>
              <motion.p key={m.n} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-4xl font-bold tabular-nums">{m.n}</motion.p>
              <p className="text-sm text-ink/60">{m.k}</p>
            </div>
          ))}
        </div>

        <AnimatePresence>{resched && <SlotEngine key={resched.id + resched.version} session={resched} />}</AnimatePresence>

        <h2 className="mt-8 font-display text-2xl font-semibold">{t.komti.timeline}</h2>
        <ol className="relative mt-4 space-y-4 pl-8">
          <span aria-hidden className="dashed-rail absolute bottom-6 left-[11px] top-6 w-0.5" />
          {sessions.map((x) => {
            const st = { ...STATUS[x.status], ...t.status[x.status] };
            const tone = TONE[st.tone];
            return (
              <motion.li layout key={x.id} className="relative">
                <span aria-hidden className={`absolute -left-[26px] top-7 h-3 w-3 rounded-full ring-4 ring-paper ${tone.dot}`} />
                <div className="rounded-[28px] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet">{fmt(t.campus.meeting, { n: x.meeting })}</p>
                    <p className="font-display text-lg font-semibold leading-tight sm:text-xl">{x.klass.name}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-500">
                      <span className="font-mono">{fmtRange(x.startsAt, x.endsAt)}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} />{x.room.code}</span>
                      <span>{x.klass.enrolled} {t.common.students}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${tone.chip}`}>{st.label} {st.emoji}</span>
                      {x.status === "micropause" && (
                        <span className="flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-sm">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-lilac-deep" style={{ width: `${(x.receipts / Math.max(1, x.klass.enrolled)) * 100}%` }} /></span>
                          {x.receipts}/{x.klass.enrolled}
                        </span>
                      )}
                      {x.status === "rescheduled" && x.lockedSlot?.startsAt && <span className="rounded-full bg-sky px-3 py-1.5 text-sm">→ {fmtDay(x.lockedSlot.startsAt, t.locale)} {fmtTime(x.lockedSlot.startsAt)} · {x.lockedSlot.roomCode}</span>}
                    </div>
                  </div>
                  {x.status === "pending" ? <SlaRing deadline={x.slaDeadline} size={60} /> : <Avatar name={x.klass.lecturerName} size={44} />}
                </div>
                <div className="mt-3 space-y-2">
                  {["confirmed", "delayed"].includes(x.status) && Date.now() >= +new Date(x.startsAt) - 15 * 60_000 && Date.now() <= +new Date(x.endsAt) + 30 * 60_000 && <PhotoCard sessionId={x.id} photoPath={x.photoPath} />}
                  {x.photoPath && !["confirmed", "delayed"].includes(x.status) && <PhotoCard sessionId={x.id} photoPath={x.photoPath} />}
                  {x.status !== "rescheduled" && x.status !== "reschedule" && <AttendancePanel sessionId={x.id} summary={x.att} />}
                </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      <aside className="space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
        <ChangeRequests items={changes} canDecide />
        <PermissionQueue permissions={permissions} canDecide={false} />
        <div>
          <h2 className="font-display text-2xl font-semibold">{t.komti.activity}</h2>
          <ol className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {feed.map((e) => (
                <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 rounded-2xl bg-white p-3 text-sm">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-lilac-deep" />
                  <span className="flex-1 text-slate-700">{e.message}</span>
                  <span className="font-mono text-[11px] text-slate-400">{fmtTime(e.createdAt)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {feed.length === 0 && <li className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">{t.common.nothingYet}</li>}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function SlotEngine({ session }: { session: View["sessions"][number] }) {
  const proposals = session.proposals ?? [];
  const [pick, setPick] = useState(proposals[0]?.id);
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const t = useT();

  return (
    <motion.section initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="relative mt-6 overflow-hidden rounded-[32px] bg-sky p-6 shadow-xl shadow-sky-deep/15">
      <div aria-hidden className="scanline pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-deep">{t.komti.engineKicker}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold leading-tight">{fmt(t.komti.engineTitle, { course: session.klass.name })}</h2>
        <p className="mt-1 text-sm text-ink/60">{fmt(t.komti.engineLead, { n: session.klass.enrolled })}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {proposals.map((p, i) => {
            const on = pick === p.id;
            const pct = p.enrolled ? Math.round(((p.enrolled - p.conflicts) / p.enrolled) * 100) : 100;
            return (
              <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.08 }}
                onClick={() => setPick(p.id)}
                className={`relative rounded-[24px] p-4 text-left transition ${on ? "bg-ink text-white" : "bg-white hover:-translate-y-0.5"}`}>
                <span className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full ${on ? "bg-mint text-ink" : "bg-paper"}`}>{on && <Check size={15} />}</span>
                <p className={`text-xs font-semibold uppercase tracking-widest ${on ? "text-white/60" : "text-ink/50"}`}>{p.kind === "optimal" ? t.komti.optimal : p.kind === "alt" ? t.komti.alt : t.komti.async}</p>
                {p.kind === "async" ? (
                  <><p className="mt-2 flex items-center gap-1.5 font-display text-lg font-semibold"><Coffee size={17} /> Micro-Pause</p><p className={`text-sm ${on ? "text-white/60" : "text-ink/50"}`}>{t.komti.asyncSub}</p></>
                ) : (
                  <>
                    <p className="mt-2 font-display text-lg font-semibold leading-tight">{fmtDay(p.startsAt!, t.locale)}</p>
                    <p className={`font-mono text-sm ${on ? "text-white/70" : "text-ink/60"}`}>{fmtRange(p.startsAt!, p.endsAt!)} · {p.roomCode}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${on ? "bg-white/20" : "bg-paper"}`}><motion.span className={`block h-full ${p.conflicts ? "bg-butter-deep" : "bg-mint-deep"}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} /></span>
                      <span className="text-xs">{p.conflicts ? fmt(t.komti.clash, { n: p.conflicts }) : t.komti.noClash}</span>
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
        <motion.button whileTap={{ scale: 0.98 }} disabled={pending || !pick}
          onClick={() => start(async () => { const r = await lockSlotAction({ sessionId: session.id, slotId: pick }); if (!r.ok) toast(r.error, "warn"); })}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white disabled:opacity-50">
          {pending ? <Loader2 className="animate-spin" size={18} /> : <Lock size={17} />} {fmt(t.komti.lock, { n: session.klass.enrolled })} <Radio size={17} />
        </motion.button>
      </div>
    </motion.section>
  );
}
