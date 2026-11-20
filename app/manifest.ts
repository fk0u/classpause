import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClassPause",
    short_name: "ClassPause",
    description: "Zero-chat class coordination and 15-minute Micro-Pause learning (prototype).",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#4338CA",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
