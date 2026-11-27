"use client";

import { Loader2 } from "lucide-react";

export function Field({ label, hint, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold">{label}{hint && <span className="font-normal text-ink/40"> · {hint}</span>}</span>
      <input {...p} className={`mt-1 min-h-12 w-full min-w-0 rounded-2xl border-2 border-transparent bg-paper px-4 text-[16px] outline-none transition focus:border-violet ${p.className ?? ""}`} />
    </label>
  );
}

export function Submit({ busy, children, className = "" }: { busy: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={busy}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet px-5 font-semibold text-white transition hover:bg-violet-deep disabled:opacity-60 ${className}`}>
      {busy && <Loader2 size={17} className="animate-spin" />} {children}
    </button>
  );
}

export function FormError({ msg }: { msg: string | null }) {
  return msg ? <p role="alert" className="rounded-2xl bg-rose px-4 py-2 text-sm text-rose-deep">{msg}</p> : null;
}
