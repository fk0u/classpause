import Link from "next/link";
import { LiveProvider } from "@/components/live";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { db, schema as s } from "@/db";
import { getTodaySessions, getUnreadCount } from "@/lib/queries";
import { Avatar } from "@/components/avatar";
import Dock, { DemoHeaderButtons } from "@/components/dock";
import TopNav from "@/components/top-nav";
import { getDict } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [t, unread] = await Promise.all([getDict(), getUnreadCount(user.id)]);

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
          <header className="flex items-center gap-3 px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
            <Link href="/" className="flex items-center gap-1.5 font-display text-2xl font-extrabold tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet text-mint">✳</span>Class<span className="text-mint">Pause</span></Link>
            <TopNav role={user.role} unread={unread} />
            <span className="ml-auto md:hidden">{demo && <DemoHeaderButtons demo={demo} />}</span>
            <Link href="/profile" className="flex md:ml-auto items-center gap-3 rounded-full p-1 hover:bg-white/10 lg:pr-4">
              <Avatar name={user.name} size={40} />
              <span className="hidden whitespace-nowrap leading-tight lg:block">
                <span className="block text-sm font-semibold">{user.name}</span>
                <span className="block text-xs text-white/50">{t.roles[user.role]}{user.studentNo ? ` · ${user.studentNo}` : ""}</span>
              </span>
            </Link>
          </header>
          <main className="panel min-h-[calc(100dvh-6rem)] px-4 pb-40 pt-8 sm:px-8">{children}</main>
        </div>
        <Dock role={user.role} unread={unread} demo={demo} />
      </div>
    </LiveProvider>
  );
}
