"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { LecturerCard, type LecturerAction } from "@/components/lecturer-card";
import { magicAction } from "@/app/actions";
import { useT, fmt, tr } from "@/lib/i18n/client";

type Card = Omit<React.ComponentProps<typeof LecturerCard>, "onAction">;

export default function MagicCard({ token, card }: { token: string; card: Card }) {
  const [done, setDone] = useState<LecturerAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  if (done) return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-[32px] bg-mint p-8 text-center">
      <CheckCircle2 size={56} className="mx-auto text-mint-deep" />
      <p className="mt-4 font-display text-xl font-bold">{fmt(t.lecturer.sentTo, { n: card.enrolled })}</p>
      <p className="mt-1 text-sm text-slate-500">{t.lecturer.sentLead}</p>
    </motion.div>
  );

  return (
    <>
      <LecturerCard {...card} onAction={async (action) => {
        const r = await magicAction({ token, action });
        if (r.ok) setDone(action); else setError(tr(t, r.error));
      }} />
      {error && <p className="mt-3 rounded-2xl bg-rose p-3 text-sm text-red-700">{error}</p>}
    </>
  );
}
