"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Megaphone, MessagesSquare, Info, Pin, Trash2, Send, Loader2, MessageCircle } from "lucide-react";
import type { feed } from "@/lib/stream";
import { createPostAction, commentAction, pinPostAction, deletePostAction } from "@/app/account-actions";
import { Avatar } from "@/components/avatar";
import { useLive } from "@/components/live";
import { useT, tr, fmt } from "@/lib/i18n/client";
import { fmtDay, fmtTime } from "@/lib/time";

type Data = Awaited<ReturnType<typeof feed>>;
type Kind = "announcement" | "discussion" | "info";
const KIND = {
  announcement: { icon: Megaphone, card: "bg-violet text-white", chip: "bg-mint text-ink" },
  info: { icon: Info, card: "bg-sky", chip: "bg-white text-ink" },
  discussion: { icon: MessagesSquare, card: "bg-white", chip: "bg-lilac text-ink" },
} as const;

export default function StreamBoard({ data, kind, course }: { data: Data; kind: Kind | null; course: string | null }) {
  const t = useT();
  const q = (k: Kind | null, c: string | null) => { const p = new URLSearchParams(); if (k) p.set("kind", k); if (c) p.set("course", c); const s = p.toString(); return `/stream${s ? `?${s}` : ""}`; };
  return (
    <>
      <Composer data={data} />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {([null, "announcement", "discussion", "info"] as const).map((k) => (
          <Link key={k ?? "all"} href={q(k, course)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${kind === k ? "bg-ink text-white" : "bg-white"}`}>
            {k ? t.stream.kinds[k] : t.stream.all}
          </Link>
        ))}
        <span className="w-2 shrink-0" />
        {data.courses.map((c) => (
          <Link key={c.id} href={q(kind, course === c.id ? null : c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${course === c.id ? "bg-violet text-white" : "bg-paper ring-1 ring-ink/10"}`}>{c.code}</Link>
        ))}
      </div>
      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {data.posts.map((p) => <PostCard key={p.id} p={p} course={data.courses.find((c) => c.id === p.classId)?.name ?? null} />)}
        </AnimatePresence>
        {data.posts.length === 0 && <li className="rounded-[28px] border-2 border-dashed border-ink/15 p-10 text-center text-ink/50">{t.stream.empty}</li>}
      </ul>
    </>
  );
}

function Composer({ data }: { data: Data }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useLive();
  const [busy, start] = useTransition();
  const [target, setTarget] = useState(`${data.cohorts[0].id}|`);
  const [cohortId, classId] = target.split("|");
  const kinds = classId ? data.can[cohortId]?.courses[classId] ?? [] : data.can[cohortId]?.cohort ?? [];
  const [kind, setKind] = useState<Kind>("discussion");
  const k = kinds.includes(kind) ? kind : "discussion";
  const [body, setBody] = useState("");
  return (
    <form className="rounded-[28px] bg-white p-4" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await createPostAction({ cohortId, classId: classId || null, kind: k, body });
        if (!r.ok) toast(tr(t, r.error!), "warn"); else { setBody(""); router.refresh(); }
      });
    }}>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} placeholder={t.stream.placeholder} aria-label={t.stream.placeholder}
        className="w-full resize-none rounded-2xl bg-paper p-3 text-[16px] outline-none focus:ring-2 focus:ring-violet" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t.stream.everyone} className="min-h-10 w-full min-w-0 rounded-full bg-paper px-3 text-sm sm:w-auto sm:max-w-[45%]">
          {data.cohorts.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={`${c.id}|`}>{t.stream.everyone}</option>
              {data.courses.filter((x) => x.cohortId === c.id).map((x) => <option key={x.id} value={`${c.id}|${x.id}`}>{x.code} · {x.name}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="flex gap-1 rounded-full bg-paper p-1">
          {(["announcement", "info", "discussion"] as const).map((x) => {
            const Icon = KIND[x].icon;
            const ok = kinds.includes(x);
            return (
              <button key={x} type="button" disabled={!ok} onClick={() => setKind(x)} title={ok ? t.stream.kinds[x] : t.stream.onlyStaff} aria-label={t.stream.kinds[x]} aria-pressed={k === x}
                className={`flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold disabled:opacity-30 ${k === x ? "bg-ink text-white" : ""}`}>
                <Icon size={14} /> <span className="hidden sm:inline">{t.stream.kinds[x]}</span>
              </button>
            );
          })}
        </div>
        <button disabled={busy || !body.trim()} className="ml-auto flex min-h-10 items-center gap-1.5 rounded-full bg-violet px-4 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {t.stream.post}
        </button>
      </div>
    </form>
  );
}

function PostCard({ p, course }: { p: Data["posts"][number]; course: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useLive();
  const [busy, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const k = KIND[p.kind];
  const dark = p.kind === "announcement";
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => start(async () => {
    const r = await fn(); if (!r.ok) toast(tr(t, r.error!), "warn"); else { after?.(); router.refresh(); }
  });
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className={`rounded-[28px] p-5 ${k.card}`}>
      <div className="flex items-center gap-3">
        <Avatar name={p.author.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.author.name}{p.author.badge && <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${dark ? "bg-white/20" : "bg-paper"}`}>{t.roles[p.author.badge as "komti"]}</span>}</p>
          <p className={`truncate text-xs ${dark ? "text-white/60" : "text-ink/50"}`}>{course ?? t.stream.everyone} · {fmtDay(p.createdAt, t.locale)} {fmtTime(p.createdAt)}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${k.chip}`}><k.icon size={13} /> {t.stream.kinds[p.kind]}</span>
      </div>
      {p.pinned && <p className={`mt-3 flex items-center gap-1 text-xs font-semibold ${dark ? "text-mint" : "text-violet"}`}><Pin size={12} /> {t.stream.pinned}</p>}
      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{p.body}</p>
      <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${dark ? "text-white/80" : "text-ink/60"}`}>
        <button onClick={() => setOpen(!open)} className="flex min-h-9 items-center gap-1.5 rounded-full px-2 font-semibold"><MessageCircle size={15} /> {p.comments.length ? fmt(t.stream.comments, { n: p.comments.length }) : t.stream.reply}</button>
        {p.canModerate && <button disabled={busy} onClick={() => act(() => pinPostAction(p.id))} className="flex min-h-9 items-center gap-1 rounded-full px-2"><Pin size={14} /> {p.pinned ? t.stream.unpin : t.stream.pin}</button>}
        {(p.mine || p.canModerate) && <button disabled={busy} onClick={() => { if (confirm(`${t.stream.delete}?`)) act(() => deletePostAction(p.id)); }} className="flex min-h-9 items-center gap-1 rounded-full px-2"><Trash2 size={14} /> {t.stream.delete}</button>}
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          {p.comments.map((c) => (
            <div key={c.id} className={`rounded-2xl px-3 py-2 text-sm ${dark ? "bg-white/10" : "bg-paper"}`}>
              <b>{c.name}</b> <span className="opacity-50">· {fmtTime(c.createdAt)}</span>
              <p className="whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); act(() => commentAction({ postId: p.id, body: reply }), () => setReply("")); }}>
            <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} placeholder={t.stream.replyPh} aria-label={t.stream.replyPh}
              className={`min-h-11 min-w-0 flex-1 rounded-full px-4 text-[16px] outline-none ${dark ? "bg-white text-ink" : "bg-paper"}`} />
            <button disabled={busy || !reply.trim()} aria-label={t.stream.reply} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-40"><Send size={16} /></button>
          </form>
        </div>
      )}
    </motion.li>
  );
}
