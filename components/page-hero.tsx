import { Flower, Scribble, Spark } from "./doodles";

export function PageHero({ kicker, title, lead, children }: { kicker?: React.ReactNode; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-violet p-5 text-white sm:p-7">
      <Flower className="pointer-events-none absolute -right-8 -top-8 w-32 opacity-90 sm:w-40" />
      <Spark className="pointer-events-none absolute bottom-3 right-24 hidden w-12 sm:block" />
      <div className="relative">
        {kicker && <p className="text-sm text-white/70">{kicker}</p>}
        <h1 className="mt-1 max-w-[80%] font-display text-3xl font-extrabold leading-none tracking-tight sm:text-5xl">{title}</h1>
        <Scribble className="mt-2 w-40" color="#A0FF83" />
        {lead && <p className="mt-2 max-w-xl text-white/80">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
