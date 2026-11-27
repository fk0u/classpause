import { requireUser } from "@/lib/auth";
import { memberships } from "@/lib/accounts";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n/server";
import SettingsView from "./view";

export const metadata = { title: "Settings · ClassPause" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [t, groups] = await Promise.all([getDict(), memberships(user.id)]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero kicker={user.email} title={t.settings.title} lead={t.settings.lead} />
      <SettingsView
        me={{ id: user.id, name: user.name, email: user.email, studentNo: user.studentNo, role: user.role, isDemo: user.isDemo }}
        groups={groups.map((g) => ({ ...g, members: Number(g.members) }))} />
    </div>
  );
}
