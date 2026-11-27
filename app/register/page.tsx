import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import LangSwitch from "@/components/lang-switch";
import { Flower, Scribble } from "@/components/doodles";
import RegisterForm from "./form";

export const metadata = { title: "Create account · ClassPause" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const [{ claim }, t] = await Promise.all([searchParams, getDict()]);
  return (
    <main className="relative min-h-dvh overflow-hidden bg-violet px-5 py-10 text-white">
      <Flower className="float absolute -right-12 -top-6 w-48 opacity-90" />
      <div className="relative mx-auto max-w-md">
        <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{claim ? t.auth.claim : t.auth.signUp}</h1>
        <Scribble className="mt-2 w-44" color="#A0FF83" />
        <section className="mt-6 rounded-[32px] bg-white p-6 text-ink shadow-2xl shadow-ink/30">
          <div className="flex justify-center"><LangSwitch /></div>
          <RegisterForm claim={claim?.slice(0, 12) ?? null} />
        </section>
      </div>
    </main>
  );
}
