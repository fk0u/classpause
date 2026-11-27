import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { manageView } from "@/lib/accounts";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n/server";
import ManageBoard from "./board";

export const metadata = { title: "Manage · ClassPause" };

export default async function ManagePage() {
  const user = await requireUser();
  const [t, groups] = await Promise.all([getDict(), manageView(user.id)]);
  if (!groups.length) redirect("/join");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero kicker={groups.map((g) => g.cohort.name).join(" · ")} title={t.manage.title} lead={groups.some((g) => g.isKomti) ? t.manage.lead : t.manage.sipenOnly} />
      <ManageBoard groups={groups} me={user.id} />
    </div>
  );
}
