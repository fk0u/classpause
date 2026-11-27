"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Zap, TimerOff, Loader2 } from "lucide-react";
import { demoExpireAction, demoRestartAction } from "@/app/actions";
import { useT } from "@/lib/i18n/client";
import { useLive } from "./live";
import { navItems } from "./nav-items";

/** Floating black dock: app nav on phones (like the reference tab bar) + the demo clock. */
export default function Dock({ role, unread, demo }: {
  role: "student" | "komti" | "lecturer"; unread: number; demo: { classId: string; sessionId: string | null } | null;
}) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const t = useT();
  const path = usePathname();
  const btn = "relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:scale-110 disabled:opacity-40";

  const restart = () => start(async () => {
    const r = await demoRestartAction(demo!.classId);
    if (r.ok) toast(t.demo.link, "info", r.data!.url); else toast(r.error, "warn");
  });
  const skip = () => start(async () => { const r = await demoExpireAction(demo!.sessionId); if (!r.ok) toast(r.error, "warn"); });
  const items = navItems(role, t);

  return (
    <>
      {/* Phones: full-width tab bar. Every target is ≥ 44 px; labels only on the active tab. */}
      <motion.nav initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
        aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-full bg-ink p-1.5 shadow-2xl shadow-black/40 ring-1 ring-white/10">
          {items.map((it) => {
            const on = path === it.href;
            return (
              <Link key={it.href} href={it.href} aria-label={it.label} aria-current={on ? "page" : undefined}
                className={`relative flex h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-full transition ${on ? "bg-white px-2 text-ink" : "text-white/70"}`}>
                <it.icon size={19} className="shrink-0" />
                {on && items.length <= 5 && <span className="truncate text-[13px] font-semibold">{it.label}</span>}
                {"badge" in it && unread > 0 && <span className="absolute right-[22%] top-1.5 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-ink" />}
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {demo && (
        <>
          {/* Tablets and up: the black demo dock. */}
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
            className="fixed inset-x-0 bottom-5 z-40 hidden justify-center px-3 md:flex">
            <div className="flex items-center gap-1.5 rounded-full bg-ink p-2 pl-4 shadow-2xl shadow-black/40 ring-1 ring-white/10">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">{pending && <Loader2 size={14} className="animate-spin" />} {t.demo.clock}</span>
              <button disabled={pending} title={t.demo.start} aria-label={t.demo.start} onClick={restart} className={`${btn} bg-mint`}><Zap size={20} /></button>
              <button disabled={pending || !demo.sessionId} title={t.demo.skip} aria-label={t.demo.skip} onClick={skip} className={`${btn} bg-butter`}><TimerOff size={20} /></button>
              <span className="hidden pr-3 text-xs text-white/50 lg:inline">{t.demo.hint}</span>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

/** Phones: the demo clock sits in the header so it never covers page content. */
export function DemoHeaderButtons({ demo }: { demo: { classId: string; sessionId: string | null } }) {
  const [pending, start] = useTransition();
  const { toast } = useLive();
  const t = useT();
  const b = "flex h-10 w-10 items-center justify-center rounded-full text-ink disabled:opacity-40";
  return (
    <span className="flex items-center gap-1.5 md:hidden">
      <button disabled={pending} title={t.demo.start} aria-label={t.demo.start} className={`${b} bg-mint`}
        onClick={() => start(async () => { const r = await demoRestartAction(demo.classId); if (r.ok) toast(t.demo.link, "info", r.data!.url); else toast(r.error, "warn"); })}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={17} />}
      </button>
      <button disabled={pending || !demo.sessionId} title={t.demo.skip} aria-label={t.demo.skip} className={`${b} bg-butter`}
        onClick={() => start(async () => { const r = await demoExpireAction(demo.sessionId); if (!r.ok) toast(r.error, "warn"); })}>
        <TimerOff size={17} />
      </button>
    </span>
  );
}
