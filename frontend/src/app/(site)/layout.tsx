import { ReactNode } from "react";
import { SiteFooter } from "@/components/home/siteFooter";
import { SiteHeader } from "@/components/home/siteHeader";
import { requestTimestamp } from "@/lib/server-time";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const timestamp = await requestTimestamp();
  return (
    <div className="journal">
      <SiteHeader timestamp={timestamp} />
      <main className="j-main" id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
