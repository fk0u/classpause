import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ClassPause",
    short_name: "ClassPause",
    description: "Zero-chat class coordination and Micro-Pause learning.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0B0F",
    theme_color: "#0B0B0F",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Radar", url: "/student", icons: [{ src: "/icons/192", sizes: "192x192" }] },
      { name: "Inbox", url: "/inbox", icons: [{ src: "/icons/192", sizes: "192x192" }] },
      { name: "Schedule", url: "/schedule", icons: [{ src: "/icons/192", sizes: "192x192" }] },
    ],
  };
}
