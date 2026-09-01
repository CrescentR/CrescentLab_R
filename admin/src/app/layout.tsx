import type { Metadata } from "next";
import { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";
import "./lab-home.css";

export const metadata: Metadata = {
  title: "CrescentLab 后台控制台",
  description: "CrescentLab 内容管理后台。",
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
