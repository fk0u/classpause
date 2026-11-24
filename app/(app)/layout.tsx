import Link from "next/link";
import { eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { db, schema as s } from "@/db";
import { getTodaySessions } from "@/lib/queries";
import { LiveProvider, LiveDot } from "@/components/live";
import { Avatar } from "@/components/avatar";
import Dock from "@/components/dock";
import TopNav from "@/components/top-nav";
import { signOutAction } from "../actions";

const ROLE_LABEL = { student: "Student", komti: "Komti", lecturer: "Lecturer" } as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  let demo: { classId: string; sessionId: string | null } | null = null;
  if (env.DEMO_MODE) {
    const [c] = await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, "IF2101-A"));
    if (c) {
      const today = await getTodaySessions([c.id]);
      const live = today.find((x) => x.status === "pending") ?? today.at(-1);
      demo = { classId: c.id, sessionId: live?.id ?? null };
    }
  }

  return (
    <LiveProvider>
      <div className="min-h-dvh bg-ink sm:p-4">
        <div className="mx-auto max-w-[1280px]">
          <header className="flex items-center gap-4 px-5 pb-6 pt-5 text-white">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight">ClassPause</span>
            </Link>
            <span className="hidden sm:block"><LiveDot /></span>
            <TopNav role={user.role} />
            <div className="ml-auto flex items-center gap-3">
              <Avatar name={user.name} size={40} />
              <div className="hidden whitespace-nowrap leading-tight lg:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-white/50">{ROLE_LABEL[user.role]}{user.studentNo ? ` · ${user.studentNo}` : ""}</p>
              </div>
              <form action={signOutAction}>
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out"><LogOut size={18} /></button>
              </form>
            </div>
          </header>
          <main className="panel min-h-[calc(100dvh-6rem)] px-4 pb-36 pt-8 sm:px-8">{children}</main>
        </div>
        <Dock demo={demo} />
      </div>
    </LiveProvider>
  );
}
