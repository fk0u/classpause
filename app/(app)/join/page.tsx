import { requireUser } from "@/lib/auth";
import { myCohorts } from "@/lib/accounts";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n/server";
import JoinForms from "./forms";

export const metadata = { title: "Join · ClassPause" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const user = await requireUser();
  const [t, mine, { code }] = await Promise.all([getDict(), myCohorts(user.id), searchParams]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero kicker={mine.map((c) => c.name).join(" · ") || user.name} title={t.auth.joinTitle} lead={t.auth.joinLead} />
      <JoinForms code={code?.slice(0, 12) ?? ""} canCreate={user.role !== "lecturer"} />
    </div>
  );
}
