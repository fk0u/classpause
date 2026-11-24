"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, BellOff, Send, Loader2 } from "lucide-react";
import { savePushSubscription, removePushSubscription, sendTestPush } from "@/app/actions";
import { useT } from "@/lib/i18n/client";
import { useLive } from "./live";

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

type State = "loading" | "unsupported" | "denied" | "off" | "on";

/** Subscribe this device to Web Push and store the subscription on the server. */
export default function PushToggle({ configured, publicKey }: { configured: boolean; publicKey: string }) {
  const t = useT();
  const { toast } = useLive();
  const [state, setState] = useState<State>("loading");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    });
  }, []);

  const enable = () => start(async () => {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
    const r = await savePushSubscription(sub.toJSON());
    if (r.ok) setState("on"); else toast(r.error, "warn");
  });

  const disable = () => start(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await removePushSubscription(sub.endpoint); await sub.unsubscribe(); }
    setState("off");
  });

  const note = !configured ? t.profile.notConfigured : state === "unsupported" ? t.profile.unsupported : state === "denied" ? t.profile.denied : state === "on" ? t.profile.enabled : null;

  return (
    <section className={`rounded-[28px] p-5 ${state === "on" ? "bg-mint" : "bg-white"}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">{state === "on" ? <BellRing size={20} /> : <BellOff size={20} />}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold">{t.profile.notifications}</h2>
          <p className="text-sm text-ink/60">{t.profile.notifLead}</p>
          {note && <p className="mt-1 text-xs font-semibold text-ink/70">{note}</p>}
        </div>
        {configured && state === "off" && (
          <button onClick={enable} disabled={pending} className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-50">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />} {t.profile.enable}
          </button>
        )}
        {configured && state === "on" && (
          <div className="flex gap-2">
            <button onClick={() => start(async () => { await sendTestPush(); })} disabled={pending} className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 font-semibold text-white"><Send size={15} /> {t.profile.test}</button>
            <button onClick={disable} disabled={pending} className="min-h-11 rounded-full bg-white px-4 font-semibold">{t.profile.disable}</button>
          </div>
        )}
      </div>
    </section>
  );
}
