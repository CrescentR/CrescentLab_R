import type { Metadata } from "next";
import { ReactNode } from "react";
import { Providers } from "./providers";
import { siteBranding } from "@/lib/site-settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrescentLab",
  description: "Developer-centric blog and CMS workspace.",
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
