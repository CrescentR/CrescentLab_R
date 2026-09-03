"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { labNavigation } from "@/lib/labHomeContent";

/** 判断 tab 是否处于激活态：首页只在精确匹配时激活，其余按路径前缀匹配以覆盖详情页 */
function isActiveTab(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/notes" && pathname.startsWith("/articles/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="lab-header lab-header-zine">
      <div className="lab-shell lab-header-inner">
        <Link className="lab-brand" href="/">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <span>CRESCENT INDEX</span>
        </Link>
        <nav aria-label="主导航" className="lab-tabs">
          {labNavigation.map((item) => {
            const active = isActiveTab(pathname, item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "lab-tab lab-tab-active" : "lab-tab"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
