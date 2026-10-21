import type { Metadata } from "next";
import { ReactNode } from "react";
import Script from "next/script";
import { Instrument_Serif, JetBrains_Mono, Newsreader } from "next/font/google";
import { Providers } from "./providers";
import { siteBranding } from "@/lib/site-settings";
import "./globals.css";
import "./lab-home.css";
import "@fontsource-variable/noto-serif-sc";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono", display: "swap",
});

export const metadata: Metadata = {
  title: "Crescent Index — 长文、札记与项目",
  description: "记录进展，整理方法，分享成果。一份持续更新的个人刊物。",
  icons: {
    icon: siteBranding.faviconUrl,
  },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><Script id="journal-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: 'document.documentElement.dataset.theme=localStorage.getItem("crescentlab-theme")==="dark"?"dark":"light"' }} /></head>
      <body className={`${instrumentSerif.variable} ${newsreader.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
