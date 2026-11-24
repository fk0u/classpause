import { tick } from "./protocol";

export function startSweeper() {
  if (process.env.DISABLE_SWEEPER === "true") return;
  const g = globalThis as unknown as { __sweeper?: NodeJS.Timeout };
  if (g.__sweeper) return;
  const run = () => tick().catch((e) => console.error("[sweeper]", e));
  void run();
  g.__sweeper = setInterval(run, 15_000);
}
