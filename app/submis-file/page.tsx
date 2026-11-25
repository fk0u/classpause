import { hasAccess, listFiles } from "@/lib/submis";
import { env } from "@/lib/env";
import Unlock from "./unlock";
import FileManager from "./manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submission Files · ClassPause", robots: { index: false, follow: false } };

export default async function SubmisPage() {
  const open = await hasAccess();
  return (
    <div className="min-h-dvh bg-ink sm:p-4">
      <div className="mx-auto max-w-[1100px]">
        <header className="flex items-center gap-3 px-5 pb-6 pt-5 text-white">
          <span className="font-display text-2xl font-bold tracking-tight">ClassPause</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">Submission files</span>
        </header>
        <main className="panel min-h-[calc(100dvh-6rem)] px-4 pb-16 pt-8 sm:px-8">
          {!env.SUBMIS_PASSWORD
            ? <p className="text-slate-500">This page is not configured on this server.</p>
            : open ? <FileManager files={await listFiles()} /> : <Unlock />}
        </main>
      </div>
    </div>
  );
}
