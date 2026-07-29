import type { Metadata } from "next";
import { ReactNode } from "react";
import { Providers } from "./providers";
import { siteBranding } from "@/lib/site-settings";
import "./globals.css";
import "./lab-home.css";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
