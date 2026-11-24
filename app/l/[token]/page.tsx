import { z } from "zod";
import { hashToken } from "@/lib/protocol";
import { getSessionByTokenHash } from "@/lib/queries";
import { db, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import MagicCard from "./magic";
import { getDict } from "@/lib/i18n/server";
import LangSwitch from "@/components/lang-switch";

export const metadata = { title: "1-Tap Card · ClassPause", robots: { index: false } };

export default async function MagicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getDict();
  const ok = z.string().regex(/^[A-Za-z0-9_-]{20,100}$/).safeParse(token).success;
  const ses = ok ? await getSessionByTokenHash(hashToken(token)) : null;
  const lecturer = ses ? (await db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, ses.klass.lecturerId)))[0]?.name : null;

  return (
    <main className="min-h-dvh bg-ink px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between"><p className="font-display text-2xl font-bold text-white">ClassPause</p><LangSwitch dark /></div>
        {ses && ses.status === "pending" ? (
          <MagicCard token={token} card={{
            className: ses.klass.name, section: ses.klass.section, startsAt: ses.startsAt, endsAt: ses.endsAt,
            room: ses.room.code, enrolled: ses.klass.enrolled, deadline: ses.slaDeadline, lecturer: lecturer ?? "Lecturer",
          }} />
        ) : (
          <div className="rounded-[32px] bg-white p-8 text-center">
            <p className="font-display text-xl font-bold">{t.lecturer.expiredTitle}</p>
            <p className="mt-2 text-sm text-slate-500">{t.lecturer.expiredLead}</p>
          </div>
        )}
      </div>
    </main>
  );
}
