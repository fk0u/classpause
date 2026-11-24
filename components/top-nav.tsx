"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { navItems } from "./nav-items";

/** Desktop pill nav in the black header (phones use the dock). */
export default function TopNav({ role, unread }: { role: "student" | "komti" | "lecturer"; unread: number }) {
  const path = usePathname();
  const t = useT();
  return (
    <nav className="mx-auto hidden items-center gap-1 md:flex">
      {navItems(role, t).map((it) => {
        const on = path === it.href;
        return (
          <Link key={it.href} href={it.href} title={it.label}
            className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm transition lg:px-4 ${on ? "bg-white text-ink" : "text-white/70 hover:text-white"}`}>
            <it.icon size={16} /> <span className="hidden lg:inline">{it.label}</span>
            {"badge" in it && unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-rose-deep">{unread}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
