"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ArrowRight, ArrowLeft, Loader2, BadgeCheck, Sparkles } from "lucide-react";
import type { getStudentView } from "@/lib/queries";
import { submitQuizAction } from "@/app/actions";
import { useLive } from "@/components/live";

type Ses = Awaited<ReturnType<typeof getStudentView>>["sessions"][number];

export default function MicroPause({ session, onClose }: { session: Ses; onClose: () => void }) {
  const mod = session.module!;
  const total = mod.steps.length + 1;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => mod.quiz.map(() => null));
  const [receipt, setReceipt] = useState<{ code: string; correct: number; total: number } | null>(null);
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const inQuiz = step === mod.steps.length;

  const submit = () => start(async () => {
    const r = await submitQuizAction({ sessionId: session.id, answers });
    if (r.ok) setReceipt(r.data!);
    else toast(r.error, "warn");
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal aria-label={mod.title} onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-[32px]">
        <div className="bg-gradient-to-br from-indigo to-indigo-900 px-6 pb-5 pt-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Micro-Pause · {mod.minutes} min</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{mod.title}</h2>
              <p className="text-sm text-indigo-200">{session.klass.name}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={18} /></button>
          </div>
          {!receipt && (
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: total }, (_, i) => (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <motion.div className="h-full bg-white" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {receipt ? (
              <motion.div key="receipt" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald text-white shadow-xl shadow-emerald/40">
                  <BadgeCheck size={48} />
                </motion.div>
                <h3 className="mt-5 font-display text-2xl font-bold">Attendance logged</h3>
                <p className="mt-1 text-slate-500">Score {receipt.correct}/{receipt.total}. Your komti and lecturer can see this receipt.</p>
                <div className="ticket mx-auto mt-6 max-w-xs rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 font-mono text-sm">
                  <p className="text-slate-500">Receipt</p>
                  <p className="text-2xl font-bold tracking-wider text-navy">{receipt.code}</p>
                </div>
                <button onClick={onClose} className="mt-6 min-h-12 w-full rounded-2xl bg-navy font-semibold text-white">Done</button>
              </motion.div>
            ) : inQuiz ? (
              <motion.div key="quiz" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <p className="flex items-center gap-2 font-display text-lg font-bold"><Sparkles size={18} className="text-indigo" /> Quick check</p>
                {mod.quiz.map((q, qi) => (
                  <fieldset key={qi}>
                    <legend className="mb-2 font-semibold">{qi + 1}. {q.q}</legend>
                    <div className="grid gap-2">
                      {q.options.map((o, oi) => {
                        const on = answers[qi] === oi;
                        return (
                          <motion.button key={oi} type="button" whileTap={{ scale: 0.98 }}
                            onClick={() => setAnswers((a) => a.map((v, j) => (j === qi ? oi : v)))}
                            className={`min-h-12 rounded-xl border-2 px-4 text-left text-[15px] transition ${on ? "border-indigo bg-indigo-50 font-semibold text-indigo-900" : "border-slate-200 hover:border-slate-300"}`}>
                            {o}
                          </motion.button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo">Step {step + 1} of {mod.steps.length}</p>
                <h3 className="mt-1 font-display text-xl font-bold">{mod.steps[step].title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-slate-700">{mod.steps[step].body}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!receipt && (
          <div className="flex gap-2 border-t border-slate-100 p-4">
            {step > 0 && <button onClick={() => setStep(step - 1)} className="flex min-h-12 items-center gap-1 rounded-2xl border-2 border-slate-200 px-4 font-semibold"><ArrowLeft size={16} /> Back</button>}
            {inQuiz ? (
              <button disabled={pending || answers.some((a) => a === null)} onClick={submit}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald font-semibold text-navy disabled:opacity-40">
                {pending ? <Loader2 className="animate-spin" size={18} /> : <BadgeCheck size={18} />} Submit &amp; log attendance
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo font-semibold text-white">
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
