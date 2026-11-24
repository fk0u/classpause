"use client";

import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import type { getLecturerView } from "@/lib/queries";
import { lecturerAction } from "@/app/actions";
import { LecturerCard } from "@/components/lecturer-card";
import { STATUS, TONE_CLASSES } from "@/components/status";
import { useLive } from "@/components/live";
import { fmtRange } from "@/lib/time";

type Ses = Awaited<ReturnType<typeof getLecturerView>>[number];

export default function LecturerBoard({ name, sessions }: { name: string; sessions: Ses[] }) {
  const { toast } = useLive();
  const waiting = sessions.filter((x) => x.status === "pending");
  const rest = sessions.filter((x) => x.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{name}</p>
        <h1 className="font-display text-3xl font-extrabold">Your classes today</h1>
        <p className="mt-1 text-sm text-slate-500">Normally these cards reach you on Telegram or WhatsApp. Four options cover every outcome, so you never type a reply.</p>
      </div>

      {waiting.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {waiting.map((x) => (
            <LecturerCard key={x.id} className={x.klass.name} section={x.klass.section} startsAt={x.startsAt} endsAt={x.endsAt}
              room={x.room.code} enrolled={x.klass.enrolled} deadline={x.slaDeadline} lecturer={name}
              onAction={async (action) => { const r = await lecturerAction({ sessionId: x.id, action }); if (!r.ok) toast(r.error, "warn"); }} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((x, i) => {
          const st = STATUS[x.status];
          return (
            <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <ShieldCheck size={18} className="text-emerald" />
              <div className="flex-1">
                <p className="font-semibold">{x.klass.name}</p>
                <p className="font-mono text-xs text-slate-500">{fmtRange(x.startsAt, x.endsAt)} · {x.room.code}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TONE_CLASSES[st.tone].chip}`}>{st.label}</span>
            </motion.div>
          );
        })}
        {sessions.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No classes today.</p>}
      </div>
    </div>
  );
}
