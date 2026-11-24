"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { GraduationCap, ClipboardList, Presentation, ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "../actions";

type Persona = { id: string; name: string; role: "student" | "komti" | "lecturer"; studentNo: string | null };

const META = {
  student: { icon: GraduationCap, title: "Student", blurb: "See if it’s safe to commute, do Micro-Pause, request leave.", grad: "from-emerald-400/30" },
  komti: { icon: ClipboardList, title: "Komti", blurb: "Run class ops: SLA timers, slot engine, permission queue.", grad: "from-indigo-400/40" },
  lecturer: { icon: Presentation, title: "Lecturer", blurb: "Answer in one tap. No typing, no group chat.", grad: "from-amber-400/30" },
};

export default function PersonaPicker({ personas }: { personas: Persona[] }) {
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const order = ["student", "komti", "lecturer"] as const;
  const list = order.flatMap((r) => personas.filter((p) => p.role === r));

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((p, i) => {
        const m = META[p.role];
        return (
          <motion.button key={p.id} disabled={pending}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, type: "spring", stiffness: 260, damping: 24 }}
            whileHover={{ y: -6, rotateX: 4, rotateY: -4 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setChosen(p.id); start(() => { void signInAction({ userId: p.id }); }); }}
            style={{ transformPerspective: 900 }}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${m.grad} to-white/5 p-5 text-left backdrop-blur-xl transition-colors hover:border-white/30 disabled:opacity-60`}>
            <m.icon className="text-white/90" size={26} />
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/60">{m.title}</p>
            <p className="font-display text-xl font-bold">{p.name}</p>
            <p className="mt-2 text-sm text-slate-300">{m.blurb}</p>
            <span className="mt-5 flex items-center gap-1 text-sm font-semibold text-white/80 group-hover:text-white">
              {pending && chosen === p.id ? <><Loader2 size={16} className="animate-spin" /> Entering…</> : <>Enter <ArrowRight size={16} className="transition group-hover:translate-x-1" /></>}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
