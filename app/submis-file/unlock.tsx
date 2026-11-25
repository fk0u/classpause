"use client";

import { useActionState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { unlockSubmis } from "./actions";

export default function Unlock() {
  const [state, action, pending] = useActionState(unlockSubmis, { error: null as string | null });
  return (
    <form action={action} className="mx-auto mt-10 max-w-sm rounded-[32px] bg-white p-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lilac"><Lock size={22} /></span>
      <h1 className="mt-4 font-display text-2xl font-bold">Team files</h1>
      <p className="mt-1 text-sm text-slate-500">STACK 2026 semifinal submission documents. Enter the team password.</p>
      <input name="password" type="password" required autoFocus autoComplete="current-password" aria-label="Password"
        className="mt-5 w-full rounded-full border-2 border-transparent bg-paper px-5 py-3 text-center outline-none focus:border-ink" />
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white disabled:opacity-50">
        {pending && <Loader2 size={16} className="animate-spin" />} Unlock
      </button>
    </form>
  );
}
