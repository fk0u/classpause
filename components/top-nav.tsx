"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, ClipboardList, Presentation, Palette } from "lucide-react";

const ITEMS = {
  student: [{ href: "/student", label: "Radar", icon: Radar }],
  komti: [{ href: "/komti", label: "Class Ops", icon: ClipboardList }, { href: "/student", label: "My Radar", icon: Radar }],
  lecturer: [{ href: "/lecturer", label: "My Classes", icon: Presentation }],
} as const;

export default function TopNav({ role }: { role: keyof typeof ITEMS }) {
  const path = usePathname();
  return (
    <nav className="mx-auto flex items-center gap-1">
      {[...ITEMS[role], { href: "/design", label: "Design", icon: Palette }].map((it) => {
        const on = path === it.href;
        return (
          <Link key={it.href} href={it.href}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition lg:px-4 ${on ? "bg-white text-ink" : "text-white/70 hover:text-white"}`}>
            <it.icon size={16} /> <span className="hidden whitespace-nowrap lg:inline">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
