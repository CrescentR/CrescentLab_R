import type { Metadata } from "next";
import { ReactNode } from "react";
import { Instrument_Serif, Newsreader } from "next/font/google";
import { Providers } from "./providers";
import { siteBranding } from "@/lib/site-settings";
import "./globals.css";
import "./lab-home.css";

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
  title: "Crescent Lab — Digital Research Laboratory",
  description: "个人项目、开源实验、技术笔记和正在构建产品的数字实验室。",
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
