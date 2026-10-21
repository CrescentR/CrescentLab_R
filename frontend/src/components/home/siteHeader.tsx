"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Rss, Search, Sun, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { labNavigation } from "@/lib/labHomeContent";
import { lunarPhase, lunarPhaseName } from "@/lib/moon";
import { MoonPhase } from "@/components/home/moonPhase";
import { useUiStore } from "@/store/uiStore";

export function SiteHeader({ timestamp }: { timestamp: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [now, setNow] = useState(timestamp);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const phase = lunarPhase(now);
  const name = lunarPhaseName(phase);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    router.push(`/notes?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  }

  const navigation = labNavigation.map((item) => (
    <Link key={item.href} href={item.href} aria-current={pathname === item.href || (item.href === "/notes" && pathname.startsWith("/articles/")) || pathname.startsWith(`${item.href}/`) ? "page" : undefined}>{item.label}</Link>
  ));

  return (
    <header className="j-header">
      <a className="j-skip" href="#main-content">跳至正文</a>
      <div className="j-wrap j-header-row">
        <Link className="j-brand" href="/" aria-label={`Crescent Index 首页，今夜${name}`}>
          <MoonPhase phase={phase} size={22} /><b>Crescent Index</b><small>今夜 · {name}</small>
        </Link>
        <nav className="j-nav" aria-label="主导航">{navigation}</nav>
        <div className="j-tools">
          <button className="j-icon-btn" aria-label={searchOpen ? "关闭搜索" : "搜索"} aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}>{searchOpen ? <X size={18} /> : <Search size={18} />}</button>
          <button className="j-icon-btn" aria-label="切换日夜模式" aria-pressed={theme === "dark"} onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
          <a className="j-icon-btn" href="/rss.xml" aria-label="RSS 订阅"><Rss size={18} /></a>
        </div>
      </div>
      <nav className="j-mobile-nav" aria-label="移动端导航">{navigation}</nav>
      {searchOpen && <form className="j-header-search j-wrap" onSubmit={search}><label htmlFor="site-search">搜索笔记</label><input id="site-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、摘要或札记内容" /><button className="j-btn" type="submit">搜索</button></form>}
    </header>
  );
}
