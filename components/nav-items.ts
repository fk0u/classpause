import { Radar, ClipboardList, Presentation, CalendarDays, Bell, UserRound, DoorOpen } from "lucide-react";
import type { Dict } from "@/lib/i18n/dict";

type Role = "student" | "komti" | "lecturer";

export function navItems(role: Role, t: Dict) {
  const home = role === "lecturer"
    ? [{ href: "/lecturer", label: t.nav.classes, icon: Presentation }]
    : role === "komti"
      ? [{ href: "/komti", label: t.nav.ops, icon: ClipboardList }, { href: "/student", label: t.nav.radar, icon: Radar }]
      : [{ href: "/student", label: t.nav.radar, icon: Radar }];
  return [
    ...home,
    { href: "/schedule", label: t.nav.schedule, icon: CalendarDays },
    { href: "/rooms", label: t.nav.rooms, icon: DoorOpen },
    { href: "/inbox", label: t.nav.inbox, icon: Bell, badge: true },
    { href: "/profile", label: t.nav.profile, icon: UserRound },
  ];
}
