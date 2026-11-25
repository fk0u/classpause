import { createHash } from "node:crypto";
import type { QuizItem } from "@/db/schema";

/**
 * Per-student quiz variant. Each student gets a different subset of the module's
 * question bank, in a different order, with shuffled options, so answers can't be
 * copied from a neighbour. Deterministic per (student, session): reloading shows the
 * same paper, and the server can rebuild it to score without trusting the client.
 * The correct answers never leave the server.
 */
export const QUESTIONS_PER_STUDENT = 4;

function rng(seed: string) {
  let h = createHash("sha256").update(seed).digest();
  let i = 0;
  return () => {
    if (i + 4 > h.length) { h = createHash("sha256").update(h).digest(); i = 0; }
    const v = h.readUInt32BE(i); i += 4;
    return v / 2 ** 32;
  };
}

function shuffle<T>(arr: T[], r: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export type QuizQuestion = { qi: number; q: string; options: { oi: number; text: string }[] };

export function quizFor(userId: string, sessionId: string, bank: QuizItem[]): QuizQuestion[] {
  const r = rng(`${userId}:${sessionId}`);
  const picks = shuffle(bank.map((_, i) => i), r).slice(0, Math.min(QUESTIONS_PER_STUDENT, bank.length));
  return picks.map((qi) => ({
    qi,
    q: bank[qi].q,
    options: shuffle(bank[qi].options.map((text, oi) => ({ oi, text })), r),
  }));
}

/** Scores answers given as original indices; refuses any answer set that isn't this student's paper. */
export function scoreQuiz(userId: string, sessionId: string, bank: QuizItem[], answers: { qi: number; oi: number }[]) {
  const paper = quizFor(userId, sessionId, bank);
  const expected = new Set(paper.map((p) => p.qi));
  if (answers.length !== paper.length || answers.some((a) => !expected.has(a.qi)) || new Set(answers.map((a) => a.qi)).size !== answers.length) return null;
  return { correct: answers.filter((a) => bank[a.qi].answer === a.oi).length, total: paper.length };
}
