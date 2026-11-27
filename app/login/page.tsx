import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { getPersonas } from "@/lib/queries";
import PersonaPicker from "./picker";
import { getDict } from "@/lib/i18n/server";
import LangSwitch from "@/components/lang-switch";
import { Flower, Spark, Squiggle, Scribble } from "@/components/doodles";

export const metadata = { title: "Sign in · ClassPause" };


export default async function LoginPage() {
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const [personas, t] = await Promise.all([getPersonas(), getDict()]);
  return (
    <main className="relative min-h-dvh overflow-hidden bg-violet text-white">
      <Flower className="float absolute -right-10 top-24 w-48 opacity-90 sm:w-64" />
      <Spark className="float absolute -left-6 top-[46%] w-28 [animation-delay:1.2s] sm:w-36" />
      <Squiggle className="absolute -bottom-24 -left-16 w-80 opacity-90 lg:left-[30%]" color="#ED9AFF" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 lg:grid-cols-2">
        <section className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="chip-tilt rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-ink">Commute radar</span>
            <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold">Micro-Pause</span>
            <span className="rotate-3 rounded-full bg-lilac px-4 py-1.5 text-sm font-semibold text-ink">Permitly</span>
          </div>
          <h1 className="mt-6 font-display text-[3.4rem] font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            {t.login.title1}<br />
            <span className="relative inline-block bg-white px-2 text-ink">{t.login.title2}</span>
          </h1>
          <Scribble className="mt-3 w-56" color="#A0FF83" />
          <p className="mt-4 max-w-md text-lg text-white/80">{t.login.lead}</p>
        </section>

        <section className="min-w-0 rounded-[36px] bg-white p-6 text-ink shadow-2xl shadow-ink/30 sm:p-8">
          <div className="flex justify-center"><LangSwitch /></div>
          <p className="mt-4 text-center text-sm text-slate-500">{t.login.note}</p>
          <h2 className="mt-1 text-center font-display text-2xl font-bold">{t.login.choose}</h2>
          <PersonaPicker personas={personas} />
        </section>
      </div>
    </main>
  );
}
