import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { getPersonas } from "@/lib/queries";
import PersonaPicker from "./picker";
import { getDict } from "@/lib/i18n/server";
import LangSwitch from "@/components/lang-switch";

export const metadata = { title: "Sign in · ClassPause" };

const ORBIT = [
  { e: "🗓️", c: "bg-butter", r: "top-[6%] left-[46%]" },
  { e: "🎧", c: "bg-lilac", r: "top-[40%] right-[2%]" },
  { e: "🧭", c: "bg-sky", r: "bottom-[6%] left-[46%]" },
  { e: "✅", c: "bg-mint", r: "top-[40%] left-[2%]" },
];

export default async function LoginPage() {
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const [personas, t] = await Promise.all([getPersonas(), getDict()]);
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-white">
      {/* floating confetti dots, like the reference */}
      <span aria-hidden className="float absolute left-[8%] top-[12%] h-5 w-5 rounded-full bg-mint" />
      <span aria-hidden className="float absolute right-[10%] top-[18%] h-8 w-8 rounded-full bg-lilac [animation-delay:1s]" />
      <span aria-hidden className="float absolute left-[20%] top-[55%] h-3 w-3 rounded-full bg-butter [animation-delay:2s]" />
      <span aria-hidden className="float absolute right-[30%] top-[8%] h-3 w-3 rounded-full bg-white/70 [animation-delay:3s]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 lg:grid-cols-2">
        <section className="min-w-0">
          <div className="relative mx-auto mb-8 aspect-square w-64 lg:mx-0 lg:w-80">
            <div className="absolute inset-[12%] rounded-full border border-white/10" />
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="orbit absolute inset-0">
              {ORBIT.map((o) => (
                <span key={o.e} className={`absolute ${o.r} -translate-x-1/2 -translate-y-1/2`}>
                  <span className={`orbit-rev flex h-14 w-14 items-center justify-center rounded-full text-2xl ${o.c}`}>{o.e}</span>
                </span>
              ))}
            </div>
            <div className="absolute inset-[34%] flex items-center justify-center rounded-full bg-white/10 font-display text-3xl font-bold shadow-[0_0_60px_rgba(235,211,248,0.35)] backdrop-blur">❚❚</div>
          </div>
          <h1 className="text-center font-display text-5xl font-bold leading-[1.05] tracking-tight lg:text-left lg:text-6xl">
            {t.login.title1}<br />{t.login.title2}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-lg text-white/60 lg:mx-0 lg:text-left">
            {t.login.lead}
          </p>
        </section>

        <section className="min-w-0 rounded-[36px] bg-white p-6 text-ink sm:p-8">
          <div className="flex justify-center"><LangSwitch /></div>
          <p className="mt-4 text-center text-sm text-slate-500">{t.login.note}</p>
          <h2 className="mt-1 text-center font-display text-2xl font-bold">{t.login.choose}</h2>
          <PersonaPicker personas={personas} />
        </section>
      </div>
    </main>
  );
}
