import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/sw-register";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const viewport = { themeColor: "#0B0B0F" };

export const metadata: Metadata = {
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  title: "ClassPause",
  description: "Zero-chat class coordination and Micro-Pause learning — STACK 2026 prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}<SwRegister /></body>
    </html>
  );
}
