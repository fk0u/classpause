import { getHealth } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ status: "ok", ...(await getHealth()) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
