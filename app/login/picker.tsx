"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "../actions";
import { Avatar } from "@/components/avatar";

type Persona = { id: string; name: string; role: "student" | "komti" | "lecturer"; studentNo: string | null };

const META = {
  student: { title: "Student", blurb: "Commute radar, Micro-Pause, leave requests", bg: "bg-mint" },
  komti: { title: "Komti", blurb: "SLA timers, slot engine, permission queue", bg: "bg-lilac" },
  lecturer: { title: "Lecturer", blurb: "Answer in one tap, never type a reply", bg: "bg-butter" },
};

export default function PersonaPicker({ personas }: { personas: Persona[] }) {
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const order = ["student", "komti", "lecturer"] as const;
  const list = order.flatMap((r) => personas.filter((p) => p.role === r));

  return (
    <div className="mt-6 grid gap-3">
      {list.map((p, i) => {
        const m = META[p.role];
        return (
          <motion.button key={p.id} disabled={pending}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i, type: "spring", stiffness: 300, damping: 26 }}
            whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setChosen(p.id); start(() => { void signInAction({ userId: p.id }); }); }}
            className={`group flex items-center gap-4 rounded-[28px] ${m.bg} p-4 text-left disabled:opacity-60`}>
            <Avatar name={p.name} size={52} ring />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">{m.title}</p>
              <p className="font-display text-lg font-bold leading-tight">{p.name}</p>
              <p className="truncate text-sm text-ink/60">{m.blurb}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition group-hover:translate-x-1">
              {pending && chosen === p.id ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
