import type { Metadata } from "next";
import { ReactNode } from "react";
import { Instrument_Serif, Newsreader } from "next/font/google";
import { Providers } from "./providers";
import { siteBranding } from "@/lib/site-settings";
import "./globals.css";
import "./lab-home.css";
import "./home-index.css";

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

export const metadata: Metadata = {
  title: "Crescent Index — Projects, Notes and Updates",
  description: "记录个人项目、近期动态与技术笔记的自托管站点。",
  icons: {
    icon: siteBranding.faviconUrl,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${instrumentSerif.variable} ${newsreader.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
