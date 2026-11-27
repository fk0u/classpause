import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: { optimizePackageImports: ["lucide-react", "motion"], serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/icon.svg", headers: [{ key: "Cache-Control", value: "public, max-age=604800, immutable" }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default config;
