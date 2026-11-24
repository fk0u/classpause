import { bus, type LiveEvent } from "@/lib/bus";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events: pushes protocol changes to every open screen. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(ctrl) {
      const send = (e: LiveEvent) => {
        if (e.userIds && !e.userIds.includes(user.id)) return;
        const { userIds: _omit, ...pub } = e;
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(pub)}\n\n`));
      };
      const ping = setInterval(() => ctrl.enqueue(enc.encode(`: ping\n\n`)), 25_000);
      bus.on("live", send);
      ctrl.enqueue(enc.encode(`retry: 3000\n\n`));
      cleanup = () => { clearInterval(ping); bus.off("live", send); };
      req.signal.addEventListener("abort", () => { cleanup(); try { ctrl.close(); } catch {} });
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
