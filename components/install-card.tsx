"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install app" using the beforeinstallprompt event, with an iOS hint. */
export default function InstallCard() {
  const t = useT();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
  }, []);

  return (
    <section className="rounded-[28px] bg-sky p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><Smartphone size={20} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">{t.profile.install}</h2>
          <p className="text-sm text-ink/60">{ios && !installed ? t.profile.installIos : t.profile.installLead}</p>
        </div>
        {installed ? (
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold"><CheckCircle2 size={16} /> {t.profile.installed}</span>
        ) : evt && (
          <button onClick={async () => { await evt.prompt(); const c = await evt.userChoice; if (c.outcome === "accepted") setInstalled(true); setEvt(null); }}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white"><Download size={16} /> {t.profile.install}</button>
        )}
      </div>
    </section>
  );
}
