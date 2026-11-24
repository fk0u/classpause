import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import DesignView from "./view";

export const metadata = { title: "Design System · ClassPause" };

export default async function DesignPage() {
  const t = await getDict();
  return (
    <div className="min-h-dvh bg-ink sm:p-4">
      <div className="mx-auto max-w-[1280px]">
        <header className="flex items-center gap-3 px-5 pb-6 pt-5 text-white">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">ClassPause</Link>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">{t.design.title}</span>
        </header>
        <main className="panel px-4 pb-16 pt-8 sm:px-8"><DesignView /></main>
      </div>
    </div>
  );
}
