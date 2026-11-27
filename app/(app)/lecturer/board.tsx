"use client";

import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import type { getLecturerView } from "@/lib/queries";
import { lecturerAction } from "@/app/actions";
import { LecturerCard } from "@/components/lecturer-card";
import { STATUS, TONE } from "@/components/status";
import DayTimeline from "@/components/day-timeline";
import PermissionQueue from "@/components/permission-queue";
import { AttendancePanel, ChangeRequests, RequestChangeButton } from "@/components/session-tools";
import { useLive } from "@/components/live";
import { fmtRange } from "@/lib/time";
import { PageHero } from "@/components/page-hero";
import { useT, fmt } from "@/lib/i18n/client";

type View = Awaited<ReturnType<typeof getLecturerView>>;
type Ses = View["sessions"][number];

export default function LecturerBoard({ name, sessions, permissions, changes }: { name: string; sessions: Ses[]; permissions: View["permissions"]; changes: View["changes"] }) {
  const { toast } = useLive();
  const t = useT();
  const waiting = sessions.filter((x) => x.status === "pending");
  const rest = sessions.filter((x) => x.status !== "pending");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <PageHero kicker={name} title={t.lecturer.title} lead={t.lecturer.lead} />

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
            const st = { ...STATUS[x.status], ...t.status[x.status] };
            return (
              <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-[28px] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${TONE[st.tone].card === "bg-white" ? "bg-paper" : TONE[st.tone].card}`}>{st.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet">{fmt(t.campus.meeting, { n: x.meeting })}</p>
                  <p className="font-display text-lg font-semibold leading-tight sm:text-xl">{x.klass.name}</p>
                  <p className="mt-1 flex gap-3 text-sm text-slate-500"><span className="font-mono">{fmtRange(x.startsAt, x.endsAt)}</span><span className="flex items-center gap-1"><MapPin size={13} />{x.room.code}</span></p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${TONE[st.tone].chip}`}>{st.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {x.status === "scheduled" && +new Date(x.startsAt) > Date.now() && <RequestChangeButton sessionId={x.id} />}
                  {x.photoPath && <a href={`/files/${x.photoPath}`} target="_blank" rel="noreferrer" className="flex min-h-10 items-center rounded-full bg-mint px-3 text-sm font-semibold">📸 {t.campus.photoDone}</a>}
                </div>
                {!["reschedule", "rescheduled"].includes(x.status) && <div className="mt-2"><AttendancePanel sessionId={x.id} summary={{}} /></div>}
              </motion.div>
            );
          })}
          {sessions.length === 0 && <p className="rounded-[28px] border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">{t.common.noClasses}</p>}
        </div>
      </section>

      <aside className="space-y-8 lg:border-l lg:border-slate-200 lg:pl-8">
        <ChangeRequests items={changes} canDecide={false} />
        <PermissionQueue permissions={permissions} canDecide />
        <h2 className="font-display text-3xl font-bold tracking-tight">{t.lecturer.schedule}</h2>
        <DayTimeline items={sessions.map((x) => ({ id: x.id, title: x.klass.name, sub: x.room.code, startsAt: x.startsAt, endsAt: x.endsAt, status: x.status }))} />
      </aside>
    </div>
  );
}
