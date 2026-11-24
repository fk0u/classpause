"use client";

import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import type { getLecturerView } from "@/lib/queries";
import { lecturerAction } from "@/app/actions";
import { LecturerCard } from "@/components/lecturer-card";
import { STATUS, TONE } from "@/components/status";
import DayTimeline from "@/components/day-timeline";
import { useLive } from "@/components/live";
import { fmtRange } from "@/lib/time";

type Ses = Awaited<ReturnType<typeof getLecturerView>>[number];

export default function LecturerBoard({ name, sessions }: { name: string; sessions: Ses[] }) {
  const { toast } = useLive();
  const waiting = sessions.filter((x) => x.status === "pending");
  const rest = sessions.filter((x) => x.status !== "pending");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <p className="text-sm text-slate-500">{name}</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">My Classes Today 🎓</h1>
        <p className="mt-2 max-w-xl text-slate-500">These cards normally reach you on Telegram or WhatsApp. Four options cover every outcome, so you never type a reply.</p>

        {waiting.length > 0 && (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {waiting.map((x) => (
              <LecturerCard key={x.id} className={x.klass.name} section={x.klass.section} startsAt={x.startsAt} endsAt={x.endsAt}
                room={x.room.code} enrolled={x.klass.enrolled} deadline={x.slaDeadline} lecturer={name}
                onAction={async (action) => { const r = await lecturerAction({ sessionId: x.id, action }); if (!r.ok) toast(r.error, "warn"); }} />
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {rest.map((x, i) => {
            const st = STATUS[x.status];
            return (
              <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-[28px] bg-white p-5">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${TONE[st.tone].card === "bg-white" ? "bg-paper" : TONE[st.tone].card}`}>{st.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-semibold leading-tight">{x.klass.name}</p>
                  <p className="mt-1 flex gap-3 text-sm text-slate-500"><span className="font-mono">{fmtRange(x.startsAt, x.endsAt)}</span><span className="flex items-center gap-1"><MapPin size={13} />{x.room.code}</span></p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${TONE[st.tone].chip}`}>{st.label}</span>
              </motion.div>
            );
          })}
          {sessions.length === 0 && <p className="rounded-[28px] border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">No classes today.</p>}
        </div>
      </section>

      <aside className="space-y-5 lg:border-l lg:border-slate-200 lg:pl-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">Schedule 🗓️</h2>
        <DayTimeline items={sessions.map((x) => ({ id: x.id, title: x.klass.name, sub: x.room.code, startsAt: x.startsAt, endsAt: x.endsAt, status: x.status }))} />
      </aside>
    </div>
  );
}
