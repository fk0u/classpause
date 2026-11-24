"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "../actions";
import { Avatar } from "@/components/avatar";
import { useT } from "@/lib/i18n/client";

type Persona = { id: string; name: string; role: "student" | "komti" | "lecturer"; studentNo: string | null };

const BG = { student: "bg-mint", komti: "bg-lilac", lecturer: "bg-butter" } as const;

export default function PersonaPicker({ personas }: { personas: Persona[] }) {
  const [pending, start] = useTransition();
  const t = useT();
  const [chosen, setChosen] = useState<string | null>(null);
  const order = ["student", "komti", "lecturer"] as const;
  const list = order.flatMap((r) => personas.filter((p) => p.role === r));

  return (
    <div className="mt-6 grid gap-3">
      {list.map((p, i) => {
        const m = { title: t.roles[p.role], blurb: t.login.blurb[p.role], bg: BG[p.role] };
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
