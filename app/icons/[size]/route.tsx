import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

/** PNG app icons generated at build/request time (no binary assets in the repo). */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const raw = (await params).size.replace(/-maskable$/, "");
  const size = SIZES.has(Number(raw)) ? Number(raw) : 192;
  const maskable = (await params).size.endsWith("-maskable");
  const bar = size * 0.11;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0F", borderRadius: maskable ? 0 : size * 0.22 }}>
        <div style={{ display: "flex", gap: bar * 0.9 }}>
          <div style={{ width: bar, height: size * 0.36, borderRadius: bar, background: "#CFF1D8" }} />
          <div style={{ width: bar, height: size * 0.36, borderRadius: bar, background: "#EBD3F8" }} />
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
