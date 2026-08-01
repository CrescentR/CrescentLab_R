"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, LogOut, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { labNavigation } from "@/lib/labHomeContent";
import { getCurrentUser, isAuthenticated, logout, type AuthUser } from "@/lib/api/client";

/** 判断 tab 是否处于激活态：首页只在精确匹配时激活，其余按路径前缀匹配以覆盖详情页 */
function isActiveTab(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const isArticle = pathname.startsWith("/articles/");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <header className={isArticle ? "lab-header lab-header-article" : "lab-header"}>
      <div className="lab-shell lab-header-inner">
        <Link className="lab-brand" href="/">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <span>CRESCENT LAB</span>
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
        <div className="lab-account-actions">
          {user ? (
            <>
              <span className="lab-account-name">{user.nickname || user.username}</span>
              {user.is_admin && <Link href="/admin"><LayoutDashboard size={15} />后台</Link>}
              <button onClick={handleLogout} type="button"><LogOut size={15} />退出</button>
            </>
          ) : (
            <>
              <Link href="/login"><LogIn size={15} />登录</Link>
              <Link className="is-primary" href="/register"><UserPlus size={15} />注册</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
