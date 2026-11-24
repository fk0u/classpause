import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/sw-register";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const viewport = { themeColor: "#0B0B0F" };

export const metadata: Metadata = {
  icons: { icon: "/icon.svg", apple: "/icons/180" },
  title: "ClassPause",
  appleWebApp: { capable: true, title: "ClassPause", statusBarStyle: "black-translucent" },
  description: "Zero-chat class coordination and Micro-Pause learning — STACK 2026 prototype.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${outfit.variable} ${jakarta.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased"><I18nProvider locale={locale}>{children}</I18nProvider><SwRegister /></body>
    </html>
  );
}
