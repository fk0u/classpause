"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Loader2, Send, Thermometer, Trophy } from "lucide-react";
import type { getStudentView } from "@/lib/queries";
import { requestPermissionAction } from "@/app/actions";
import { permissionSchema } from "@/lib/validation";
import { useLive } from "@/components/live";

type Ses = Awaited<ReturnType<typeof getStudentView>>["sessions"][number];

export default function LeaveSheet({ session, onClose }: { session: Ses; onClose: () => void }) {
  const [type, setType] = useState<"sick" | "dispensation">("sick");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { toast } = useLive();

  const send = () => {
    const input = { sessionId: session.id, type, note };
    const check = permissionSchema.safeParse(input); // same schema the server enforces
    if (!check.success) return setError(check.error.issues[0].message);
    start(async () => {
      const r = await requestPermissionAction(input);
      if (r.ok) { toast(r.message ?? "Sent", "ok"); onClose(); } else setError(r.error);
    });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal aria-label="Request leave" onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-xl rounded-t-[36px] bg-paper p-6 pb-10 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <h2 className="font-display text-2xl font-semibold">Request leave</h2>
        <p className="text-sm text-slate-500">{session.klass.name} · goes straight to your komti’s queue</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {([["sick", "Sick", Thermometer], ["dispensation", "Dispensation", Trophy]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setType(v)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-full border-2 font-semibold transition ${type === v ? "border-ink bg-ink text-white" : "border-transparent bg-white"}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="note">Reason</label>
        <textarea id="note" value={note} onChange={(e) => { setNote(e.target.value); setError(null); }} maxLength={280} rows={3}
          placeholder={type === "sick" ? "e.g. Fever, clinic letter attached" : "e.g. Regional debate competition"}
          className="mt-1 w-full rounded-3xl border-2 border-transparent bg-white p-4 text-[15px] outline-none focus:border-ink" />
        <div className="mt-1 flex justify-between text-xs"><span className="text-red-600">{error}</span><span className="text-slate-400">{note.length}/280</span></div>
        <button onClick={send} disabled={pending} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white disabled:opacity-50">
          {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />} Send to komti
        </button>
      </motion.div>
    </motion.div>
  );
}
