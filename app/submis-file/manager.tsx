"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FileText, Film, Presentation, FileArchive, File, Download, Eye, Trash2, Upload, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

type F = { name: string; size: number; modified: string };

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const fmtDate = (d: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Makassar", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

function kind(n: string) {
  const l = n.toLowerCase();
  if (/\.(mp4|mov|webm)$/.test(l)) return { icon: Film, bg: "bg-lilac", label: "Video" };
  if (l.includes("deck") || /\.pptx$/.test(l)) return { icon: Presentation, bg: "bg-butter", label: "Deck" };
  if (l.includes("proposal")) return { icon: FileText, bg: "bg-mint", label: "Proposal" };
  if (/\.zip$/.test(l)) return { icon: FileArchive, bg: "bg-rose", label: "Archive" };
  if (/\.pdf$/.test(l)) return { icon: FileText, bg: "bg-sky", label: "Document" };
  return { icon: File, bg: "bg-paper", label: "File" };
}

/** What the handbook asks for at the semifinal, checked against the files present. */
const REQUIRED = [
  { label: "Proposal PDF with signed declaration", test: (n: string) => /proposal/i.test(n) && /\.pdf$/i.test(n) },
  { label: "Team video (≤ 2 min, 1080p)", test: (n: string) => /\.(mp4|mov|webm)$/i.test(n) },
];

export default function FileManager({ files }: { files: F[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = files.reduce((n, f) => n + f.size, 0);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    for (const file of Array.from(list)) {
      setBusy(file.name);
      const r = await fetch(`/submis-file/f/${encodeURIComponent(file.name)}`, { method: "PUT", body: file });
      if (!r.ok) setError(`${file.name}: ${await r.text()}`);
    }
    setBusy(null);
    router.refresh();
  }

  async function remove(name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setBusy(name);
    await fetch(`/submis-file/f/${encodeURIComponent(name)}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">STACK 2026 · Semifinal · due 30 Nov, 23:59 WIB</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Submission Files 🗂️</h1>
          <p className="mt-1 text-slate-500">{files.length} files · {fmtSize(total)}</p>
        </div>
        <button onClick={() => input.current?.click()} disabled={!!busy}
          className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
        </button>
        <input ref={input} type="file" multiple hidden accept=".pdf,.mp4,.mov,.webm,.png,.jpg,.jpeg,.zip,.docx,.pptx,.md,.txt" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {REQUIRED.map((r) => {
          const ok = files.some((f) => r.test(f.name));
          return (
            <div key={r.label} className={`flex items-center gap-3 rounded-[24px] p-4 ${ok ? "bg-mint" : "border-2 border-dashed border-slate-300"}`}>
              {ok ? <CheckCircle2 size={20} className="text-mint-deep" /> : <CircleDashed size={20} className="text-slate-400" />}
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="ml-auto text-xs text-ink/60">{ok ? "Ready" : "Missing"}</span>
            </div>
          );
        })}
      </div>

      {error && <p className="rounded-2xl bg-rose p-3 text-sm">{error}</p>}

      <ul className="space-y-3">
        {files.map((f, i) => {
          const k = kind(f.name);
          const href = `/submis-file/f/${encodeURIComponent(f.name)}`;
          return (
            <motion.li key={f.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex flex-wrap items-center gap-4 rounded-[28px] bg-white p-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${k.bg}`}><k.icon size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-semibold">{f.name}</p>
                <p className="text-xs text-slate-500">{k.label} · {fmtSize(f.size)} · {fmtDate(f.modified)} WITA</p>
              </div>
              <div className="flex gap-2">
                <a href={href} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-1.5 rounded-full bg-paper px-4 text-sm font-semibold hover:bg-slate-200"><Eye size={15} /> Open</a>
                <a href={`${href}?download`} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white"><Download size={15} /> Download</a>
                <button onClick={() => remove(f.name)} disabled={busy === f.name} aria-label={`Delete ${f.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-slate-500 hover:bg-rose hover:text-rose-deep"><Trash2 size={15} /></button>
              </div>
            </motion.li>
          );
        })}
        {files.length === 0 && <li className="rounded-[28px] border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">No files yet. Upload the proposal and video.</li>}
      </ul>
    </div>
  );
}
