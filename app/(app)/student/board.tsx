"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInAction, uploadProofAction } from "@/app/actions";
import { useLive } from "@/components/live";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Play, Music2, FileHeart, BadgeCheck, MoreHorizontal, Hand, Paperclip, Loader2 } from "lucide-react";
import type { getStudentView } from "@/lib/queries";
import { STATUS, TONE } from "@/components/status";
import { SlaRing } from "@/components/countdown";
import { Avatar } from "@/components/avatar";
import DayTimeline from "@/components/day-timeline";
import { fmtRange, fmtDay, fmtDateTime } from "@/lib/time";
import MicroPause from "./micro-pause";
import LeaveSheet from "./leave-sheet";
import { PageHero } from "@/components/page-hero";
import { useT, fmt } from "@/lib/i18n/client";

type View = Awaited<ReturnType<typeof getStudentView>>;
type Ses = View["sessions"][number];

export default function StudentBoard({ firstName, sessions, completedPauses }: View & { firstName: string }) {
  const [pause, setPause] = useState<Ses | null>(null);
  const [leave, setLeave] = useState<Ses | null>(null);
  const t = useT();

  const safe = sessions.filter((x) => x.status === "confirmed").length;
  const hold = sessions.filter((x) => ["pending", "delayed"].includes(x.status)).length;
  const freed = sessions.filter((x) => ["micropause", "rescheduled"].includes(x.status)).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full min-w-0">
            <PageHero kicker={<>{fmt(t.student.hi, { name: firstName })} · {fmtDay(new Date(), t.locale)}</>} title={t.student.title} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat n={sessions.length} label={t.student.statToday} cls="bg-sky" />
          <Stat n={safe} label={t.student.statSafe} cls="bg-mint" badge={safe ? "🎉" : undefined} />
          <Stat n={hold} label={t.student.statHold} cls="border-2 border-dashed border-slate-300 bg-transparent" />
          <Stat n={freed} label={t.student.statFreed} cls="bg-lilac" />
        </div>

        {sessions.length === 0 && (
          <div className="mt-6 rounded-[28px] border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">{t.common.noClasses}</div>
        )}

        <ol className="relative mt-8 space-y-5 pl-8">
          <span aria-hidden className="dashed-rail absolute bottom-6 left-[11px] top-6 w-0.5" />
          <AnimatePresence>
            {sessions.map((x, i) => (
              <motion.li key={x.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 28 }} className="relative">
                <span aria-hidden className={`absolute -left-[26px] top-8 h-3 w-3 rounded-full ring-4 ring-paper ${TONE[STATUS[x.status].tone].dot}`} />
                {x.status === "micropause" && x.module && !x.receipt
                  ? <PauseCard x={x} onPlay={() => setPause(x)} />
                  : <SessionCard x={x} onLeave={() => setLeave(x)} />}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>

      <aside className="space-y-5 lg:border-l lg:border-slate-200 lg:pl-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">{t.student.side}</h2>
        <DayTimeline items={sessions.map((x) => ({ id: x.id, title: x.klass.name, sub: x.room.code, startsAt: x.startsAt, endsAt: x.endsAt, status: x.status }))} />
        <div className="rounded-[28px] bg-white p-5">
          <p className="text-sm text-slate-500">{t.student.semester}</p>
          <p className="mt-1 font-display text-5xl font-bold">{completedPauses}</p>
          <p className="text-sm text-slate-500">{t.student.pausesDone}</p>
        </div>
      </aside>

      <AnimatePresence>{pause && pause.module && <MicroPause session={pause} onClose={() => setPause(null)} />}</AnimatePresence>
      <AnimatePresence>{leave && <LeaveSheet session={leave} onClose={() => setLeave(null)} />}</AnimatePresence>
    </div>
  );
}

function Stat({ n, label, cls, badge }: { n: number; label: string; cls: string; badge?: string }) {
  return (
    <div className={`relative rounded-[24px] p-4 text-center ${cls}`}>
      {badge && <span className="absolute -right-1 -top-3 text-2xl">{badge}</span>}
      <motion.p key={n} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-4xl font-bold tabular-nums">{n}</motion.p>
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}

function SessionCard({ x, onLeave }: { x: Ses; onLeave: () => void }) {
  const t = useT();
  const { toast } = useLive();
  const router = useRouter();
  const [busy, start] = useTransition();
  const st = { ...STATUS[x.status], ...t.status[x.status] };
  const tone = TONE[st.tone];
  const now = Date.now();
  const live = ["scheduled", "pending", "confirmed", "delayed"].includes(x.status) && now >= +new Date(x.startsAt) - 15 * 60_000 && now <= +new Date(x.endsAt);
  const attLabel = x.attendance ? t.campus[x.attendance] : null;
  const upload = (f: File) => start(async () => {
    const fd = new FormData(); fd.set("permissionId", x.permission!.id); fd.set("file", f);
    const r = await uploadProofAction(fd);
    if (r.ok) { toast(t.campus.letterIn, "ok"); router.refresh(); } else toast(r.error, "warn");
  });
  return (
    <div className="rounded-[28px] bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet">{fmt(t.campus.meeting, { n: x.meeting })}</p>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-tight sm:text-2xl">{x.klass.name}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="font-mono">{fmtRange(x.startsAt, x.endsAt)}{x.delayMinutes ? ` +${x.delayMinutes}m` : ""}</span>
            <span className="flex items-center gap-1"><MapPin size={13} />{x.room.code}</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">{st.advice}</p>
        </div>
        {x.status === "pending"
          ? <SlaRing deadline={x.slaDeadline} size={60} />
          : <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${tone.card === "bg-white" ? "bg-paper" : tone.card}`}>{st.emoji}</span>}
      </div>

      {x.status === "rescheduled" && x.lockedSlot?.startsAt && (
        <div className="mt-3 rounded-2xl bg-sky p-3 text-sm">
          <span className="font-semibold">{t.student.newSlot}</span> {fmtDay(x.lockedSlot.startsAt, t.locale)} · {fmtRange(x.lockedSlot.startsAt, x.lockedSlot.endsAt!)} · {x.lockedSlot.roomCode}
        </div>
      )}

      {live && x.attendance !== "present" && !x.permission && (
        <button disabled={busy} onClick={() => start(async () => { const r = await checkInAction(x.id); if (r.ok) { toast(t.campus.checkedIn, "ok"); router.refresh(); } else toast(r.error, "warn"); })}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Hand size={17} />} {t.campus.checkIn}
        </button>
      )}

      {x.permission && x.permission.status !== "rejected" && (
        <div className={`mt-3 flex flex-wrap items-center gap-2 rounded-2xl p-3 text-sm ${x.permission.proofPath ? "bg-mint" : x.permission.status === "expired" ? "bg-rose" : "bg-butter"}`}>
          <Paperclip size={15} className="shrink-0" />
          <span className="min-w-0 flex-1 font-medium">
            {x.permission.proofPath ? t.campus.letterIn : x.permission.status === "expired" ? t.campus.expired : fmt(t.campus.letterDue, { when: fmtDateTime(x.permission.proofDueAt ?? x.permission.createdAt, t.locale) })}
          </span>
          {!x.permission.proofPath && x.permission.status !== "expired" && (
            <label className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-white">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />} {t.campus.letterUpload}
              <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {attLabel && <span className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide ${x.attendance === "absent" ? "bg-rose text-rose-deep" : "bg-mint text-mint-deep"}`}>{attLabel}</span>}
        <motion.span key={x.status} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`rounded-full px-4 py-2 text-sm font-medium ${tone.chip}`}>{st.label} {st.emoji}</motion.span>
        {x.receipt && <span className="flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-deep"><BadgeCheck size={15} /> {x.receipt.code} · {x.receipt.correct}/{x.receipt.total}</span>}
        <span className="ml-auto flex items-center gap-2">
          <Avatar name={x.klass.lecturerName} size={34} />
          {x.permission ? (
            <span className="rounded-full bg-paper px-3 py-2 text-xs font-medium text-slate-600">{x.permission.type === "sick" ? t.leave.sick : t.leave.dispensation} · {x.permission.status === "approved" ? t.komti.excused : x.permission.status === "rejected" ? t.komti.declined : x.permission.status === "expired" ? t.campus.absent : "⏳"}</span>
          ) : !x.receipt && (
            <button onClick={onLeave} aria-label={t.leave.title} title={t.leave.title}
              className="flex h-10 items-center gap-1.5 rounded-full bg-paper px-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              <FileHeart size={15} /> {t.student.leave}
            </button>
          )}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-slate-500"><MoreHorizontal size={16} /></span>
        </span>
      </div>
    </div>
  );
}

/** The lilac "now playing" card from the reference, for an active Micro-Pause. */
function PauseCard({ x, onPlay }: { x: Ses; onPlay: () => void }) {
  const t = useT();
  return (
    <motion.button onClick={onPlay} whileHover={{ rotate: 0, scale: 1.01 }} initial={{ rotate: -2 }} animate={{ rotate: -1.5 }}
      className="relative block w-full overflow-hidden rounded-[32px] bg-lilac p-6 text-left shadow-xl shadow-lilac-deep/20">
      <Music2 aria-hidden size={26} className="float absolute right-[38%] top-5 text-white" />
      <Music2 aria-hidden size={20} className="float absolute bottom-16 right-6 text-white [animation-delay:1.5s]" />
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-lilac-deep">{fmt(t.student.pauseKicker, { min: x.module!.minutes })}</p>
          <h3 className="mt-1 font-display text-3xl font-semibold leading-tight">{x.module!.title}</h3>
          <p className="mt-2 text-sm text-ink/60">{fmt(t.student.pauseLead, { course: x.klass.name })}</p>
        </div>
        <span className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.4s]" />
          <span className="absolute inset-0 rounded-full border-[6px] border-white/70" />
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink"><Play size={26} fill="currentColor" /></span>
        </span>
      </div>
      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold">{t.student.startModule}</span>
    </motion.button>
  );
}
