import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { getPersonas } from "@/lib/queries";
import PersonaPicker from "./picker";

export const metadata = { title: "Sign in · ClassPause" };

export default async function LoginPage() {
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const personas = await getPersonas();
  return (
    <main className="relative min-h-dvh overflow-hidden bg-navy text-white">
      <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-5 py-16">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo font-display text-lg font-extrabold">❚❚</span>
          <span className="font-display text-xl font-bold">ClassPause</span>
        </div>
        <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
          No more guessing.<br /><span className="text-indigo-300">Every class has an answer.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-300">
          Choose a role to enter. This build runs on a synthetic East Kalimantan campus dataset; campus SSO replaces this screen in a real rollout.
        </p>
        <PersonaPicker personas={personas} />
      </div>
    </main>
  );
}
