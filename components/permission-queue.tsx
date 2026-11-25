"use client";

import { useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X, Pin, Thermometer, Trophy, Eye } from "lucide-react";
import { decidePermissionAction } from "@/app/actions";
import { Avatar } from "./avatar";
import { useLive } from "./live";
import { useT } from "@/lib/i18n/client";
import { fmtTime } from "@/lib/time";

export type PermissionRow = {
  id: string; type: "sick" | "dispensation"; note: string; status: "pending" | "approved" | "rejected";
  createdAt: Date | string; name: string; className?: string;
};

/** Leave requests. The lecturer decides; the komti sees the same cards read-only. */
export default function PermissionQueue({ permissions, canDecide }: { permissions: PermissionRow[]; canDecide: boolean }) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const t = useT();
  const decide = (permissionId: string, decision: "approved" | "rejected") =>
    start(async () => { const r = await decidePermissionAction({ permissionId, decision }); if (!r.ok) toast(r.error, "warn"); });

  return (
    <div>
      <h2 className="font-display text-3xl font-bold tracking-tight">{t.komti.requests}</h2>
      {!canDecide && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Eye size={14} /> {t.komti.lecturerDecides}</p>}
      <div className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {permissions.map((p, i) => {
            const bg = p.status === "approved" ? "bg-mint" : p.status === "rejected" ? "bg-white" : p.type === "sick" ? "bg-rose" : "bg-butter";
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 10, rotate: i % 2 ? 1 : -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0 }}
                className={`rounded-[28px] p-4 ${bg}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {p.type === "sick" ? <Thermometer size={16} /> : <Trophy size={16} />}
                  <span>{p.type === "sick" ? t.leave.sick : t.leave.dispensation}</span>
                  <span className="ml-auto text-xs text-ink/50">{fmtTime(p.createdAt)}</span>
                </div>
                <div className="mt-3 rounded-2xl bg-white/70 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.name} size={30} />
                    <p className="text-sm font-semibold">{p.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{p.note}</p>
                  <p className="mt-1 text-xs text-ink/40">{p.className}</p>
                </div>
                {p.status === "pending" && canDecide ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button disabled={pending} onClick={() => decide(p.id, "rejected")} className="flex min-h-11 items-center justify-center gap-1 rounded-full bg-white text-sm font-semibold"><X size={15} /> {t.komti.decline}</button>
                    <button disabled={pending} onClick={() => decide(p.id, "approved")} className="flex min-h-11 items-center justify-center gap-1 rounded-full bg-ink text-sm font-semibold text-white"><Check size={15} /> {t.komti.approve}</button>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-1 text-sm font-semibold"><Pin size={14} /> {p.status === "approved" ? t.komti.excused : p.status === "rejected" ? t.komti.declined : t.komti.awaitingLecturer}</p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {permissions.length === 0 && <p className="rounded-[28px] border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">{t.komti.noRequests}</p>}
      </div>
    </div>
  );
}
