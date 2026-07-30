import { ReactNode } from "react";
import { SiteFooter } from "@/components/home/siteFooter";
import { SiteHeader } from "@/components/home/siteHeader";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lab-home">
      <SiteHeader />
      <main className="lab-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
