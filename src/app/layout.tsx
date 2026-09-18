import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { computeCurrentTheme } from "@/lib/color-engine/engine";
import { settingsStore } from "@/lib/storage/settings-store";

// Load-bearing: the color engine must compute a fresh palette every
// request (it reads/writes local state and includes per-visit jitter).
// Do not remove this or enable next.config.ts's cacheComponents flag
// without redesigning how the engine forces a fresh render -- see
// /context.md, "Deliberate Next.js 16 API choices".
export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await settingsStore.readPublic();
  return {
    title: settings.blogger.name,
    description: settings.blogger.bio,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await computeCurrentTheme(null);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} style={theme.cssVars as CSSProperties}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
