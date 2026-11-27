"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Crown, Plus, RefreshCw, Trash2, UserRoundCog, X, Pencil, Loader2 } from "lucide-react";
import type { manageView } from "@/lib/accounts";
import * as act from "@/app/account-actions";
import { Field, Submit, FormError } from "@/components/form-bits";
import { useLive } from "@/components/live";
import { useT, tr, fmt } from "@/lib/i18n/client";

type Group = Awaited<ReturnType<typeof manageView>>[number];
type Course = Group["courses"][number];
type Res = { ok: boolean; error?: string } | undefined;
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function useRun() {
  const t = useT();
  const router = useRouter();
  const { toast } = useLive();
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<Res>, onOk?: () => void) => start(async () => {
    const r = await fn();
    if (r && !r.ok) toast(tr(t, r.error!), "warn");
    else { onOk?.(); router.refresh(); }
  });
  return { busy, run };
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const t = useT();
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { void navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-ink">
      {ok ? <Check size={15} /> : <Copy size={15} />} {ok ? t.manage.copied : label}
    </button>
  );
}

export default function ManageBoard({ groups, me }: { groups: Group[]; me: string }) {
  return <div className="space-y-10">{groups.map((g) => <GroupView key={g.cohort.id} g={g} me={me} />)}</div>;
}

function GroupView({ g, me }: { g: Group; me: string }) {
  const t = useT();
  const { busy, run } = useRun();
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [adding, setAdding] = useState(g.courses.length === 0);
  const [err, setErr] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const joinUrl = `${origin}/join?code=${g.cohort.inviteCode}`;

  return (
    <section className="space-y-4">
      {g.isKomti && (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] bg-ink p-5 text-white">
            <p className="text-sm text-white/60">{t.manage.invite} · {g.cohort.name}</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-mint sm:text-5xl">{g.cohort.inviteCode}</p>
            <p className="mt-2 break-all text-xs text-white/50">{fmt(t.manage.share, { url: `${origin}/join` })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyBtn text={joinUrl} label={t.manage.copy} />
              <button disabled={busy} onClick={() => run(() => act.regenerateInviteAction(g.cohort.id))} className="flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-semibold"><RefreshCw size={15} /> {t.manage.regenerate}</button>
            </div>
          </div>
          <form className="space-y-3 rounded-[28px] bg-white p-5" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(() => act.updateCohortAction({ cohortId: g.cohort.id, name: f.get("name"), program: f.get("program") }));
          }}>
            <Field label={t.auth.groupName} name="name" defaultValue={g.cohort.name} required />
            <Field label={t.auth.program} name="program" defaultValue={g.cohort.program} required />
            <Submit busy={busy} className="bg-ink hover:bg-ink">{t.common.save}</Submit>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{t.manage.courses}</h2>
        {g.isKomti && !adding && <button onClick={() => setAdding(true)} className="flex min-h-11 items-center gap-1.5 rounded-full bg-violet px-4 text-sm font-semibold text-white"><Plus size={16} /> {t.manage.addCourse}</button>}
      </div>

      {g.isKomti && adding && (
        <form className="grid gap-3 rounded-[28px] bg-sky p-5 sm:grid-cols-2" onChange={() => setErr(null)} onSubmit={(e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          const form = e.currentTarget;
          run(async () => { const r = await act.addCourseAction({ ...f, cohortId: g.cohort.id }); if (!r.ok) { setErr(tr(t, r.error!)); return; } form.reset(); setAdding(false); return r; });
        }}>
          <Field label={t.manage.code} name="code" placeholder="IF2101" required className="bg-white font-mono uppercase" />
          <Field label={t.manage.course} name="name" required className="bg-white" />
          <Field label={t.manage.lecturer} name="lecturerName" required className="bg-white" />
          <Field label={t.manage.lecturerEmail} name="lecturerEmail" type="email" required className="bg-white" />
          <Field label={t.manage.credits} name="credits" type="number" min={1} max={6} defaultValue={3} required className="bg-white" />
          <div className="flex items-end gap-2">
            {g.courses.length > 0 && <button type="button" onClick={() => setAdding(false)} className="flex min-h-12 items-center rounded-full bg-white px-4 font-semibold"><X size={16} /></button>}
            <Submit busy={busy}>{t.manage.addCourse}</Submit>
          </div>
          <div className="sm:col-span-2"><FormError msg={err} /></div>
        </form>
      )}

      {g.courses.length === 0 && !adding && <p className="rounded-[28px] border-2 border-dashed border-ink/15 p-8 text-center text-ink/50">{t.manage.empty}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {g.courses.map((c) => <CourseCard key={c.id} c={c} g={g} me={me} origin={origin} />)}
      </div>

      {g.isKomti && (
        <div className="rounded-[28px] bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Crown size={20} className="text-violet" /> {t.manage.transferKomti}</h2>
          <p className="mt-1 text-sm text-ink/60">{t.manage.transferWarn}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select value={to} onChange={(e) => setTo(e.target.value)} aria-label={t.manage.transferTo} className="min-h-12 flex-1 rounded-2xl bg-paper px-4 text-[16px]">
              <option value="">{t.manage.transferTo}…</option>
              {g.members.filter((m) => m.id !== me).map((m) => <option key={m.id} value={m.id}>{m.name}{m.studentNo ? ` · ${m.studentNo}` : ""}</option>)}
            </select>
            <button disabled={!to || busy} onClick={() => { if (confirm(t.manage.transferWarn)) run(() => act.transferKomtiAction({ cohortId: g.cohort.id, to })); }}
              className="min-h-12 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-40">{t.manage.transferKomti}</button>
          </div>
          <p className="mt-4 text-sm font-semibold">{t.manage.members} · {g.members.length}</p>
          <p className="mt-1 text-sm text-ink/60">{g.members.map((m) => m.name).join(", ")}</p>
        </div>
      )}
    </section>
  );
}

function CourseCard({ c, g, me, origin }: { c: Course; g: Group; me: string; origin: string }) {
  const t = useT();
  const { busy, run } = useRun();
  const [edit, setEdit] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sipenName = g.members.find((m) => m.id === c.sipenId)?.name;

  return (
    <article className="min-w-0 rounded-[28px] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold text-violet">{c.code} · {c.credits} SKS</p>
          <p className="font-display text-xl font-bold leading-tight">{c.name}</p>
          <p className="truncate text-sm text-ink/60">{c.lecturer.name} · {c.lecturer.email}</p>
        </div>
        {g.isKomti && <button onClick={() => setEdit(!edit)} aria-label={t.common.save} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper"><Pencil size={15} /></button>}
      </div>

      {c.lecturer.claimCode && (
        <div className="mt-3 rounded-2xl bg-butter p-3 text-sm">
          <p className="break-all">{fmt(t.manage.lecturerCode, { url: `${origin}/register?claim=${c.lecturer.claimCode}` })}</p>
          <div className="mt-2"><CopyBtn text={`${origin}/register?claim=${c.lecturer.claimCode}`} label={t.manage.copy} /></div>
        </div>
      )}

      {edit && (
        <form className="mt-3 grid gap-2" onChange={() => setErr(null)} onSubmit={(e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          run(async () => { const r = await act.updateCourseAction({ ...f, classId: c.id }); if (!r.ok) { setErr(tr(t, r.error!)); return; } setEdit(false); return r; });
        }}>
          <Field label={t.manage.course} name="name" defaultValue={c.name} required />
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Field label={t.manage.lecturer} name="lecturerName" defaultValue={c.lecturer.name} required />
            <Field label={t.manage.credits} name="credits" type="number" min={1} max={6} defaultValue={c.credits} required />
          </div>
          <Field label={t.manage.lecturerEmail} name="lecturerEmail" type="email" defaultValue={c.lecturer.email} required />
          <FormError msg={err} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => { if (confirm(t.manage.confirmRemove)) run(() => act.removeCourseAction(c.id)); }}
              className="flex min-h-12 items-center gap-1.5 rounded-full bg-rose px-4 text-sm font-semibold text-rose-deep"><Trash2 size={15} /> {t.manage.remove}</button>
            <Submit busy={busy} className="bg-ink hover:bg-ink">{t.common.save}</Submit>
          </div>
        </form>
      )}

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><UserRoundCog size={15} /> {g.isKomti ? t.manage.sipen : t.manage.transferSipen}</p>
        <select value={c.sipenId ?? ""} disabled={busy} aria-label={t.manage.sipen}
          onChange={(e) => run(() => act.setSipenAction({ classId: c.id, to: e.target.value || null }))}
          className="mt-1 min-h-12 w-full rounded-2xl bg-paper px-4 text-[16px]">
          {g.isKomti ? <option value="">{t.manage.noSipen}</option> : <option value={me}>{sipenName}</option>}
          {g.members.filter((m) => g.isKomti || m.id !== me).map((m) => <option key={m.id} value={m.id}>{m.name}{m.studentNo ? ` · ${m.studentNo}` : ""}</option>)}
        </select>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">{t.manage.schedule}</p>
        <ul className="mt-1 space-y-1.5">
          {c.meetings.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-paper px-3 py-2 text-sm">
              <span className="w-10 font-semibold">{t.manage.days[m.day]}</span>
              <span className="font-mono">{hm(m.startMin)}–{hm(m.endMin)}</span>
              <span className="flex-1 truncate text-ink/60">{m.room}</span>
              {g.isKomti && <button disabled={busy} onClick={() => run(() => act.removeMeetingAction(m.id))} aria-label={t.manage.remove} className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><X size={14} /></button>}
            </li>
          ))}
        </ul>
        {g.isKomti && <MeetingForm classId={c.id} />}
      </div>
    </article>
  );
}

function MeetingForm({ classId }: { classId: string }) {
  const t = useT();
  const { busy, run } = useRun();
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]" onChange={() => setErr(null)} onSubmit={(e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const form = e.currentTarget;
      run(async () => { const r = await act.addMeetingAction({ ...f, classId }); if (!r.ok) { setErr(tr(t, r.error!)); return; } form.reset(); return r; });
    }}>
      <select name="day" aria-label={t.manage.day} defaultValue="1" className="min-h-11 min-w-0 rounded-2xl bg-paper px-3 text-[16px]">
        {[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{t.manage.days[d]}</option>)}
      </select>
      <input name="room" aria-label={t.manage.room} placeholder={t.manage.room} required className="min-h-11 min-w-0 rounded-2xl bg-paper px-3 text-[16px] uppercase" />
      <input name="start" type="time" aria-label={t.manage.start} defaultValue="07:30" required className="min-h-11 min-w-0 rounded-2xl bg-paper px-3 text-[16px]" />
      <input name="end" type="time" aria-label={t.manage.end} defaultValue="09:10" required className="min-h-11 min-w-0 rounded-2xl bg-paper px-3 text-[16px]" />
      <button disabled={busy} className="col-span-2 flex min-h-11 items-center justify-center gap-1 rounded-full bg-violet px-4 text-sm font-semibold text-white sm:col-span-1">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {t.manage.addMeeting}
      </button>
      {err && <div className="col-span-full"><FormError msg={err} /></div>}
    </form>
  );
}
