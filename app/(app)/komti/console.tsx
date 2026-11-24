"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Timer, Inbox, CalendarClock, Check, Lock, Radio, Coffee, Users, FileHeart, Loader2, BadgeCheck, X, ScrollText, GraduationCap } from "lucide-react";
import type { getKomtiView } from "@/lib/queries";
import { lockSlotAction, decidePermissionAction } from "@/app/actions";
import { STATUS, TONE_CLASSES } from "@/components/status";
import { SlaRing } from "@/components/countdown";
import { useLive } from "@/components/live";
import { fmtRange, fmtDay, fmtTime } from "@/lib/time";

type View = Awaited<ReturnType<typeof getKomtiView>>;

export default function KomtiConsole({ sessions, permissions, feed }: View) {
  const pendingPerms = permissions.filter((p) => p.status === "pending");
  const timers = sessions.filter((x) => x.status === "pending");
  const resched = sessions.find((x) => x.status === "reschedule");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Komti · Informatics ’26 Class A</p>
          <h1 className="font-display text-3xl font-extrabold">Class Operations</h1>
        </div>
        <Link href="/student" className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <GraduationCap size={16} /> My student radar
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Activity, k: "Classes today", v: sessions.length },
          { icon: Timer, k: "SLA timers", v: timers.length },
          { icon: Inbox, k: "Permissions", v: pendingPerms.length },
        ].map((m, i) => (
          <motion.div key={m.k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <m.icon size={18} className="text-indigo" />
            <motion.p key={m.v} initial={{ scale: 1.3, color: "#4338CA" }} animate={{ scale: 1, color: "#0F172A" }} className="mt-2 font-mono text-3xl font-bold tabular-nums">{m.v}</motion.p>
            <p className="text-xs text-slate-500">{m.k}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>{resched && <SlotEngine key={resched.id + resched.version} session={resched} />}</AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-3">
          <h2 className="font-display text-lg font-bold">Today’s timeline</h2>
          {sessions.map((x) => {
            const st = STATUS[x.status];
            const tone = TONE_CLASSES[st.tone];
            return (
              <motion.div layout key={x.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className={`h-12 w-1.5 rounded-full ${tone.bar}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{x.klass.name}</p>
                  <p className="font-mono text-xs text-slate-500">{fmtRange(x.startsAt, x.endsAt)} · {x.room.code} · {x.klass.enrolled} students</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${tone.chip}`}>{st.label}</span>
                    {x.status === "micropause" && <span className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck size={12} /> {x.receipts}/{x.klass.enrolled} done</span>}
                    {x.status === "rescheduled" && x.lockedSlot?.startsAt && <span className="text-xs text-indigo">→ {fmtDay(x.lockedSlot.startsAt)} {fmtTime(x.lockedSlot.startsAt)} · {x.lockedSlot.roomCode}</span>}
                  </div>
                </div>
                {x.status === "pending" && <SlaRing deadline={x.slaDeadline} size={56} />}
              </motion.div>
            );
          })}
        </section>

        <section className="space-y-6 lg:col-span-2">
          <PermissionQueue permissions={permissions} />
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><ScrollText size={18} className="text-indigo" /> Activity</h2>
            <ol className="relative space-y-3 border-l-2 border-slate-200 pl-4">
              <AnimatePresence initial={false}>
                {feed.map((e) => (
                  <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="relative text-sm">
                    <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo" />
                    <p className="text-slate-700">{e.message}</p>
                    <p className="font-mono text-[11px] text-slate-400">{fmtTime(e.createdAt)}</p>
                  </motion.li>
                ))}
              </AnimatePresence>
              {feed.length === 0 && <li className="text-sm text-slate-400">Nothing yet today.</li>}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}

function SlotEngine({ session }: { session: View["sessions"][number] }) {
  const proposals = session.proposals ?? [];
  const [pick, setPick] = useState(proposals[0]?.id);
  const [pending, start] = useTransition();
  const { toast } = useLive();

  return (
    <motion.section initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="relative overflow-hidden rounded-3xl border-2 border-indigo bg-white p-5 shadow-xl shadow-indigo/20">
      <div aria-hidden className="scanline pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex items-center gap-2"><CalendarClock size={20} className="text-indigo" /><h2 className="font-display text-lg font-bold">Conflict-Free Slot Engine</h2></div>
        <p className="mt-1 text-sm text-slate-500">{session.klass.name} · checked {session.klass.enrolled} student timetables, the lecturer’s classes and every room’s bookings</p>
        <div className="mt-4 grid gap-2">
          {proposals.map((p, i) => {
            const on = pick === p.id;
            const pct = p.enrolled ? Math.round(((p.enrolled - p.conflicts) / p.enrolled) * 100) : 100;
            return (
              <motion.button key={p.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
                onClick={() => setPick(p.id)}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${on ? "border-indigo bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-indigo bg-indigo text-white" : "border-slate-300"}`}>{on && <Check size={14} />}</span>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-indigo">Option {i + 1} · {p.kind === "optimal" ? "Optimal" : p.kind === "alt" ? "Alternative" : "Async"}</p>
                  {p.kind === "async"
                    ? <p className="flex items-center gap-1 font-semibold"><Coffee size={14} /> Convert to Micro-Pause + Q&amp;A</p>
                    : <p className="font-semibold">{fmtDay(p.startsAt!)} · {fmtRange(p.startsAt!, p.endsAt!)} · {p.roomCode}</p>}
                  {p.kind !== "async" && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200"><motion.div className={`h-full ${p.conflicts ? "bg-amber" : "bg-emerald"}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} /></div>
                      <span className={`font-mono text-xs ${p.conflicts ? "text-amber-700" : "text-emerald-700"}`}>{p.conflicts ? `${p.conflicts} student conflict${p.conflicts > 1 ? "s" : ""}` : "0 conflicts"} · room free</span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
        <motion.button whileTap={{ scale: 0.98 }} disabled={pending || !pick}
          onClick={() => start(async () => { const r = await lockSlotAction({ sessionId: session.id, slotId: pick }); if (!r.ok) toast(r.error, "warn"); })}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-navy font-semibold text-white disabled:opacity-50">
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />} Lock &amp; broadcast to {session.klass.enrolled} students <Radio size={16} />
        </motion.button>
      </div>
    </motion.section>
  );
}

function PermissionQueue({ permissions }: { permissions: View["permissions"] }) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const decide = (permissionId: string, decision: "approved" | "rejected") =>
    start(async () => { const r = await decidePermissionAction({ permissionId, decision }); if (!r.ok) toast(r.error, "warn"); });

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><FileHeart size={18} className="text-indigo" /> Permission queue</h2>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {permissions.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Users size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name} <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-bold uppercase text-slate-500">{p.type}</span></p>
                  <p className="truncate text-xs text-slate-500">{p.className} · {p.note}</p>
                </div>
              </div>
              {p.status === "pending" ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button disabled={pending} onClick={() => decide(p.id, "rejected")} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border-2 border-slate-200 text-sm font-semibold"><X size={14} /> Decline</button>
                  <button disabled={pending} onClick={() => decide(p.id, "approved")} className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-emerald text-sm font-semibold text-navy"><Check size={14} /> Approve</button>
                </div>
              ) : (
                <p className={`mt-2 text-xs font-semibold ${p.status === "approved" ? "text-emerald-700" : "text-slate-500"}`}>{p.status === "approved" ? "Excused" : "Declined"}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {permissions.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">Queue is empty.</p>}
      </div>
    </div>
  );
}
