"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Camera, CheckCircle2, ChevronDown, Loader2, Users, CalendarClock, Check, X, Send } from "lucide-react";
import { uploadPhotoAction, getAttendanceAction, markAttendanceAction, decideChangeAction, requestChangeAction } from "@/app/actions";
import type { SlotProposal } from "@/db/schema";
import { Avatar } from "./avatar";
import { useLive } from "./live";
import { useT, fmt, tr } from "@/lib/i18n/client";
import { fmtDay, fmtRange, fmtTime } from "@/lib/time";

/* ---------- Komti: class photo while the class runs ---------- */
export function PhotoCard({ sessionId, photoPath }: { sessionId: string; photoPath: string | null }) {
  const t = useT();
  const { toast } = useLive();
  const router = useRouter();
  const [busy, start] = useTransition();
  const send = (f: File) => start(async () => {
    const fd = new FormData(); fd.set("sessionId", sessionId); fd.set("file", f);
    const r = await uploadPhotoAction(fd);
    if (r.ok) { toast(t.campus.photoDone, "ok"); router.refresh(); } else toast(r.error, "warn");
  });
  if (photoPath) return (
    <a href={`/files/${photoPath}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-mint p-2 pr-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/files/${photoPath}`} alt={t.campus.photoTitle} className="h-14 w-20 rounded-xl object-cover" />
      <span className="flex items-center gap-1.5 text-sm font-semibold text-mint-deep"><CheckCircle2 size={16} /> {t.campus.photoDone}</span>
    </a>
  );
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-butter p-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white">{busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}</span>
      <span className="min-w-0 flex-1"><b className="block text-sm">{t.campus.photoUpload}</b><span className="block text-xs text-ink/60">{t.campus.photoLead}</span></span>
      <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
    </label>
  );
}

/* ---------- Komti & lecturer: who attended this meeting ---------- */
type Row = { id: string; name: string; studentNo: string | null; status: string | null; source: string | null };
export function AttendancePanel({ sessionId, summary }: { sessionId: string; summary: Record<string, number> }) {
  const t = useT();
  const { toast } = useLive();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ meeting: number; rows: Row[] } | null>(null);
  const [busy, start] = useTransition();
  const load = () => start(async () => { setData(await getAttendanceAction(sessionId)); });
  const mark = (userId: string, status: "present" | "absent") => start(async () => {
    const r = await markAttendanceAction({ sessionId, userId, status });
    if (!r.ok) toast(r.error, "warn"); else setData(await getAttendanceAction(sessionId));
  });
  const p = summary.present ?? 0, i = (summary.permit ?? 0) + (summary.sick ?? 0), a = summary.absent ?? 0;
  const color: Record<string, string> = { present: "bg-mint text-mint-deep", micropause: "bg-lilac text-lilac-deep", permit: "bg-butter text-butter-deep", sick: "bg-butter text-butter-deep", absent: "bg-rose text-rose-deep" };
  return (
    <div className="rounded-2xl bg-paper">
      <button onClick={() => { setOpen(!open); if (!data) load(); }} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm">
        <Users size={15} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">{t.campus.attendance}{Object.keys(summary).length ? ` · ${fmt(t.campus.summary, { p, i, a })}` : ""}</span>
        <ChevronDown size={16} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-2 pb-2">
            {busy && !data && <li className="p-3 text-center"><Loader2 size={16} className="mx-auto animate-spin" /></li>}
            {data?.rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-xl px-1 py-1.5">
                <Avatar name={r.name} size={28} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm">{r.name}</span><span className="block font-mono text-[10px] text-ink/40">{r.studentNo}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${r.status ? color[r.status] : "bg-white text-ink/40"}`}>{r.status ? t.campus[r.status as "present"] : t.campus.notYet}</span>
                {r.status !== "present" && r.status !== "micropause" && <button disabled={busy} onClick={() => mark(r.id, "present")} aria-label={t.campus.markPresent} title={t.campus.markPresent} className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><Check size={14} /></button>}
                {r.status !== "absent" && <button disabled={busy} onClick={() => mark(r.id, "absent")} aria-label={t.campus.markAbsent} title={t.campus.markAbsent} className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><X size={14} /></button>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Komti confirms a lecturer's change request; lecturer sees its status ---------- */
export type ChangeRow = {
  id: string; status: "pending" | "confirmed" | "rejected" | "cancelled"; reason: string; proposals: SlotProposal[]; chosen: SlotProposal | null;
  className: string; by?: string; startsAt?: Date | string; endsAt?: Date | string;
};
export function ChangeRequests({ items, canDecide }: { items: ChangeRow[]; canDecide: boolean }) {
  const t = useT();
  const { toast } = useLive();
  const [busy, start] = useTransition();
  const [pick, setPick] = useState<Record<string, string>>({});
  if (!items.length) return null;
  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><CalendarClock size={20} /> {t.campus.changes}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((c) => (
          <li key={c.id} className={`rounded-[24px] p-4 ${c.status === "pending" ? "bg-sky" : c.status === "confirmed" ? "bg-mint" : "bg-white"}`}>
            <p className="font-display text-lg font-semibold leading-tight">{c.className}</p>
            {c.startsAt && <p className="font-mono text-xs text-ink/60">{fmtDay(c.startsAt, t.locale)} · {fmtRange(c.startsAt, c.endsAt!)}{c.by ? ` · ${fmt(t.campus.by, { name: c.by })}` : ""}</p>}
            <p className="mt-1 text-sm text-ink/70">{fmt(t.campus.reasonLabel, { r: c.reason })}</p>
            {c.status === "pending" && canDecide ? (
              <>
                <div className="mt-3 grid gap-2">
                  {c.proposals.map((p) => (
                    <button key={p.id} onClick={() => setPick({ ...pick, [c.id]: p.id })}
                      className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl px-3 text-left text-sm ${pick[c.id] === p.id ? "bg-ink text-white" : "bg-white"}`}>
                      <span className="font-semibold">{fmtDay(p.startsAt!, t.locale)} · {fmtTime(p.startsAt!)} · {p.roomCode}</span>
                      <span className="text-xs opacity-70">{p.conflicts ? fmt(t.komti.clash, { n: p.conflicts }) : t.komti.noClash}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button disabled={busy} onClick={() => start(async () => { const r = await decideChangeAction({ requestId: c.id, decision: "reject" }); if (!r.ok) toast(r.error, "warn"); })}
                    className="flex min-h-11 items-center justify-center gap-1 rounded-full bg-white text-sm font-semibold"><X size={15} /> {t.campus.reject}</button>
                  <button disabled={busy || !pick[c.id]} onClick={() => start(async () => { const r = await decideChangeAction({ requestId: c.id, decision: "confirm", slotId: pick[c.id] }); if (!r.ok) toast(r.error, "warn"); })}
                    className="flex min-h-11 items-center justify-center gap-1 rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-40"><Check size={15} /> {t.campus.confirm}</button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm font-semibold">
                {c.status === "pending" ? t.campus.requested : c.status === "confirmed" ? `${t.campus.confirmed}: ${c.chosen?.startsAt ? `${fmtDay(c.chosen.startsAt, t.locale)} ${fmtTime(c.chosen.startsAt)} · ${c.chosen.roomCode}` : ""}` : t.campus.rejected}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Lecturer asks to move a class ---------- */
export function RequestChangeButton({ sessionId }: { sessionId: string }) {
  const t = useT();
  const { toast } = useLive();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-10 items-center gap-1.5 rounded-full bg-sky px-3 text-sm font-semibold"><CalendarClock size={15} /> {t.campus.requestChange}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal aria-label={t.campus.changeTitle} onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-full max-w-xl rounded-t-[32px] bg-paper p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-6">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
              <h2 className="font-display text-2xl font-semibold">{t.campus.changeTitle}</h2>
              <p className="text-sm text-slate-500">{t.campus.changeLead}</p>
              <label className="mt-4 block text-sm font-semibold" htmlFor="reason">{t.campus.reason}</label>
              <input id="reason" value={reason} maxLength={160} onChange={(e) => { setReason(e.target.value); setError(null); }} placeholder={t.campus.reasonPh}
                className="mt-1 min-h-12 w-full rounded-full border-2 border-transparent bg-white px-4 text-[16px] outline-none focus:border-ink" />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button disabled={busy} onClick={() => start(async () => {
                const r = await requestChangeAction({ sessionId, reason });
                if (r.ok) { toast(t.campus.requested, "ok"); setOpen(false); } else setError(tr(t, r.error));
              })} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t.campus.send}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
