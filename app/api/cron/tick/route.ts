import { env } from "@/lib/env";
import { tick } from "@/lib/protocol";

export const dynamic = "force-dynamic";

/** External clock (e.g. system cron) in case the in-process sweeper is disabled. */
export async function POST(req: Request) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await tick());
}
