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

  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
      className="fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3">
      <div className="flex items-center gap-1.5 rounded-full bg-ink p-2 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <nav className="flex items-center gap-1 md:hidden">
          {navItems(role, t).map((it) => {
            const on = path === it.href;
            return (
              <Link key={it.href} href={it.href} aria-label={it.label}
                className={`relative flex h-11 items-center justify-center gap-2 rounded-full transition ${on ? "bg-white px-3 text-ink" : "w-10 text-white/70"}`}>
                <it.icon size={19} />
                {on && <span className={`whitespace-nowrap text-sm font-semibold ${demo ? "hidden min-[440px]:inline" : ""}`}>{it.label}</span>}
                {"badge" in it && unread > 0 && <span className="absolute right-1 top-1.5 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-ink" />}
              </Link>
            );
          })}
        </nav>

        {demo && (
          <>
            <span className="h-7 w-px bg-white/15 md:hidden" />
            <span className="ml-2 hidden items-center gap-1.5 text-xs font-semibold text-white/70 md:flex">
              {pending && <Loader2 size={14} className="animate-spin" />} {t.demo.clock}
            </span>
            <button disabled={pending} title={t.demo.start} aria-label={t.demo.start}
              onClick={() => start(async () => {
                const r = await demoRestartAction(demo.classId);
                if (r.ok) toast(t.demo.link, "info", r.data!.url);
                else toast(r.error, "warn");
              })} className={`${btn} bg-mint`}>
              <Zap size={20} />
            </button>
            <button disabled={pending || !demo.sessionId} title={t.demo.skip} aria-label={t.demo.skip}
              onClick={() => start(async () => { const r = await demoExpireAction(demo.sessionId); if (!r.ok) toast(r.error, "warn"); })}
              className={`${btn} bg-butter`}>
              <TimerOff size={20} />
            </button>
            <span className="hidden pr-3 text-xs text-white/50 lg:inline">{t.demo.hint}</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
