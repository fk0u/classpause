import type { ModuleStep, QuizItem } from "./schema";

/** Micro-Pause modules keyed by class code. Each quiz is a bank: students get 4 random questions from it. */
export const MODULES: Record<string, { title: string; minutes: number; steps: ModuleStep[]; quiz: QuizItem[] }> = {
  "IF2101-A": {
    title: "NAND as a Universal Gate", minutes: 15,
    steps: [
      { title: "Why NAND?", body: "A NAND gate outputs 0 only when every input is 1. That single rule is enough to build NOT, AND and OR, which means any logic function can be built from NAND alone." },
      { title: "Build NOT and AND", body: "Tie both inputs together and NAND becomes NOT. Feed a NAND into a NAND-as-NOT and you get AND. Two gates, one primitive." },
      { title: "Build OR", body: "Invert each input with a NAND-as-NOT, then NAND the results: by De Morgan, ¬(¬A ∧ ¬B) = A ∨ B. Three NAND gates make an OR." },
    ],
    quiz: [
      { q: "NAND(1,1) equals…", options: ["0", "1"], answer: 0 },
      { q: "NAND(0,1) equals…", options: ["0", "1"], answer: 1 },
      { q: "NAND with both inputs tied together behaves like…", options: ["AND", "OR", "NOT"], answer: 2 },
      { q: "How many NAND gates build an AND?", options: ["1", "2", "3"], answer: 1 },
      { q: "How many NAND gates build an OR?", options: ["2", "3", "4"], answer: 1 },
      { q: "NAND is called universal because…", options: ["It is the fastest gate", "Any logic function can be built from it", "It uses no transistors"], answer: 1 },
      { q: "Which law turns ¬(¬A ∧ ¬B) into A ∨ B?", options: ["De Morgan", "Distributive", "Absorption"], answer: 0 },
      { q: "NAND is the same as…", options: ["NOT of AND", "AND of NOT", "NOT of OR"], answer: 0 },
      { q: "Besides NAND, which other gate is universal?", options: ["XOR", "NOR", "AND"], answer: 1 },
      { q: "A 2-input NAND outputs 1 for how many of its 4 input rows?", options: ["1", "2", "3"], answer: 2 },
    ],
  },
  "IF2102-A": {
    title: "Big-O in 15 Minutes", minutes: 15,
    steps: [
      { title: "Growth, not speed", body: "Big-O describes how running time grows with input size n, ignoring constants." },
      { title: "Common classes", body: "O(1) constant, O(log n) binary search, O(n) a single loop, O(n log n) good sorts, O(n²) nested loops." },
    ],
    quiz: [
      { q: "Binary search on a sorted array is…", options: ["O(n)", "O(log n)", "O(n²)"], answer: 1 },
      { q: "Two nested loops over n items is usually…", options: ["O(n)", "O(n log n)", "O(n²)"], answer: 2 },
      { q: "Reading one array element by index is…", options: ["O(1)", "O(n)", "O(log n)"], answer: 0 },
      { q: "Merge sort runs in…", options: ["O(n)", "O(n log n)", "O(n²)"], answer: 1 },
      { q: "Big-O ignores…", options: ["Constant factors", "Input size", "Loops"], answer: 0 },
      { q: "Finding the max in an unsorted array is…", options: ["O(1)", "O(log n)", "O(n)"], answer: 2 },
      { q: "O(2n + 5) simplifies to…", options: ["O(n)", "O(2n)", "O(1)"], answer: 0 },
      { q: "Which grows fastest?", options: ["O(n log n)", "O(n²)", "O(n)"], answer: 1 },
    ],
  },
  "IF2103-A": {
    title: "Propositional Logic Warm-up", minutes: 15,
    steps: [{ title: "Implication", body: "p → q is false only when p is true and q is false." }],
    quiz: [
      { q: "p → q when p = T, q = F is…", options: ["True", "False"], answer: 1 },
      { q: "p → q when p = F, q = F is…", options: ["True", "False"], answer: 0 },
      { q: "p ∧ q is true when…", options: ["Both are true", "Either is true", "Neither is true"], answer: 0 },
      { q: "p ∨ q is false when…", options: ["Both are false", "One is false", "Both are true"], answer: 0 },
      { q: "¬(p ∧ q) is equivalent to…", options: ["¬p ∨ ¬q", "¬p ∧ ¬q", "p ∨ q"], answer: 0 },
      { q: "The contrapositive of p → q is…", options: ["q → p", "¬q → ¬p", "¬p → ¬q"], answer: 1 },
    ],
  },
};
