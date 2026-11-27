import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/queries";
import { getDict } from "@/lib/i18n/server";
import { pushConfigured } from "@/lib/notify";
import Link from "next/link";
import { sipenCourses, myCohorts } from "@/lib/accounts";
import ProfileView from "./view";

export async function generateMetadata() {
  return { title: `${(await getDict()).nav.profile} · ClassPause` };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, sipen, groups, t] = await Promise.all([getProfile(user.id), sipenCourses(user.id), myCohorts(user.id), getDict()]);
  const links = [
    ...(user.role === "komti" || sipen.length ? [{ href: "/manage", label: user.role === "komti" ? t.manage.title : t.manage.transferSipen, c: "bg-violet text-white" }] : []),
    { href: "/settings", label: t.nav.settings, c: "bg-ink text-white" },
    { href: "/stream", label: t.stream.title, c: "bg-lilac" },
    { href: "/schedule", label: t.nav.schedule, c: "bg-white" },
    { href: "/rooms", label: t.nav.rooms, c: "bg-white" },
  ];
  return (
    <>
    <div className="mx-auto mb-6 max-w-5xl">
      {groups.length > 0 && <p className="mb-2 text-sm text-ink/50">{t.manage.group}: {groups.map((g) => g.name).join(" · ")}{sipen.length ? ` · ${t.roles.sipen}` : ""}</p>}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {links.map((l) => <Link key={l.href} href={l.href} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${l.c}`}>{l.label} →</Link>)}
      </div>
    </div>
    <ProfileView
      user={{ name: user.name, email: user.email, role: user.role, studentNo: user.studentNo }}
      profile={profile}
      push={{ configured: pushConfigured, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "" }}
    />
    </>
  );
}
