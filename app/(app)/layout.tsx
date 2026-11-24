import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { db, schema as s } from "@/db";
import { getTodaySessions } from "@/lib/queries";
import { LiveProvider, LiveDot } from "@/components/live";
import DemoBar from "@/components/demo-bar";
import { signOutAction } from "../actions";

const ROLE_LABEL = { student: "Student", komti: "Komti", lecturer: "Lecturer" } as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  let demo: { classId: string; sessionId: string | null } | null = null;
  if (env.DEMO_MODE) {
    const [c] = await db.select({ id: s.classes.id }).from(s.classes).where(and(eq(s.classes.code, "IF2101-A")));
    if (c) {
      const today = await getTodaySessions([c.id]);
      const live = today.find((x) => x.status === "pending") ?? today.at(-1);
      demo = { classId: c.id, sessionId: live?.id ?? null };
    }
  }

  return (
    <LiveProvider>
      <div className="min-h-dvh bg-canvas">
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo text-xs font-extrabold text-white">❚❚</span>
              <span className="font-display font-bold">ClassPause</span>
            </Link>
            <LiveDot />
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-500">{ROLE_LABEL[user.role]}{user.studentNo ? ` · ${user.studentNo}` : ""}</p>
              </div>
              <form action={signOutAction}>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Sign out"><LogOut size={16} /></button>
              </form>
            </div>
          </div>
          {demo && <DemoBar classId={demo.classId} sessionId={demo.sessionId} />}
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-6">{children}</main>
      </div>
    </LiveProvider>
  );
}
