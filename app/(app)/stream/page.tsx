import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { feed } from "@/lib/stream";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n/server";
import StreamBoard from "./board";

export const metadata = { title: "Stream · ClassPause" };

export default async function StreamPage({ searchParams }: { searchParams: Promise<{ kind?: string; course?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const kind = (["announcement", "discussion", "info"] as const).find((k) => k === sp.kind);
  const course = sp.course && /^[0-9a-f-]{36}$/.test(sp.course) ? sp.course : undefined;
  const [t, data] = await Promise.all([getDict(), feed(user.id, { kind, classId: course })]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero kicker={data.cohorts.map((c) => c.name).join(" · ") || user.name} title={t.stream.title} lead={t.stream.lead} />
      {data.cohorts.length === 0
        ? <Link href="/join" className="block rounded-[28px] bg-mint p-6 text-center font-semibold">{t.stream.noGroup} →</Link>
        : <StreamBoard data={data} kind={kind ?? null} course={course ?? null} />}
    </div>
  );
}
