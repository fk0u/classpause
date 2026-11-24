"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { LecturerCard, type LecturerAction } from "@/components/lecturer-card";
import { magicAction } from "@/app/actions";

type Card = Omit<React.ComponentProps<typeof LecturerCard>, "onAction">;

export default function MagicCard({ token, card }: { token: string; card: Card }) {
  const [done, setDone] = useState<LecturerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (done) return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-[32px] bg-mint p-8 text-center">
      <CheckCircle2 size={56} className="mx-auto text-mint-deep" />
      <p className="mt-4 font-display text-xl font-bold">Sent to {card.enrolled} students</p>
      <p className="mt-1 text-sm text-slate-500">They see the update on their radar right now. You can close this page.</p>
    </motion.div>
  );

  return (
    <>
      <LecturerCard {...card} onAction={async (action) => {
        const r = await magicAction({ token, action });
        if (r.ok) setDone(action); else setError(r.error);
      }} />
      {error && <p className="mt-3 rounded-2xl bg-rose p-3 text-sm text-red-700">{error}</p>}
    </>
  );
}
