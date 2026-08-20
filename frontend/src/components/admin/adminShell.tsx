"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  Construction,
  Eye,
  FileText,
  Flame,
  Gauge,
  HardDrive,
  Home,
  Image,
  LogOut,
  MessageSquare,
  Moon,
  Palette,
  PenLine,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { backgroundImageStyle, siteBranding } from "@/lib/site-settings";
import { getCurrentUser, isAuthenticated, logout, type AuthUser } from "@/lib/api/client";
import { useUiStore } from "@/store/uiStore";
import { buttonPress, fadeUp, stagger, transitionFast } from "@/components/home/motionConfig";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: Gauge, tone: "cyan" },
  { href: "/admin/postManagement", label: "内容", icon: FileText, tone: "purple" },
  { href: "/admin/projects", label: "项目", icon: Flame, tone: "amber" },
  { href: "/admin/observatory", label: "观测台", icon: Eye, tone: "green" },
  { href: "/admin/builds", label: "构建中", icon: Construction, tone: "cyan" },
  { href: "/admin/media", label: "媒体", icon: Image, tone: "amber" },
  { href: "/admin/storage", label: "存储", icon: HardDrive, tone: "cyan" },
  { href: "/admin/comments", label: "评论", icon: MessageSquare, tone: "green" },
  { href: "/admin/users", label: "用户", icon: Users, tone: "rose" },
  { href: "/admin/plugins", label: "插件", icon: BookOpen, tone: "cyan" },
  { href: "/admin/themes", label: "主题", icon: Palette, tone: "purple" },
  { href: "/admin/settings", label: "设置", icon: Settings, tone: "neutral" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    void getCurrentUser()
      .then((currentUser) => {
        if (!currentUser.is_admin) {
          router.replace("/");
          return;
        }
        setUser(currentUser);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setAuthChecked(true));
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--muted)]">
        正在验证身份…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="flex min-h-screen">
        <aside className="admin-sidebar hidden w-72 shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface-glass)] lg:flex lg:flex-col">
          <div className="px-5 py-6">
            <Link className="flex items-center gap-3" href="/admin">
              <span
                aria-label="CrescentLab admin logo"
                className="block size-11 shrink-0 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[length:20px_20px] bg-center bg-no-repeat"
                role="img"
                style={backgroundImageStyle(siteBranding.adminLogoUrl)}
              />
              <span className="min-w-0">
                <span className="block truncate font-lab-display text-xl font-bold leading-tight text-[var(--text-strong)]">
                  CrescentLab
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">后台控制台</span>
              </span>
            </Link>

            <motion.div
              animate="visible"
              className="mt-6 flex gap-2"
              initial="hidden"
              variants={stagger}
            >
              <motion.div className="min-w-0 flex-1" variants={fadeUp}>
                <Link
                  className="admin-sidebar-action admin-sidebar-action-secondary"
                  href="/"
                >
                  <ArrowLeft className="shrink-0" size={14} strokeWidth={2} />
                  <span>返回前台</span>
                </Link>
              </motion.div>
              <motion.div className="min-w-0 flex-1" variants={fadeUp}>
                <Link
                  className="admin-sidebar-action admin-sidebar-action-primary"
                  href="/admin/postManagement"
                >
                  <PenLine className="shrink-0" size={14} strokeWidth={2} />
                  <span>新建</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <nav className="admin-sidebar-nav flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  className={cn("admin-sidebar-link", active && "is-active")}
                  href={item.href}
                  key={item.href}
                >
                  {active && (
                    <motion.span
                      className="absolute inset-0 rounded-[var(--radius)] border border-[var(--cyan)] bg-[var(--cyan-soft)]"
                      layoutId="admin-nav-active"
                      transition={transitionFast}
                    />
                  )}
                  <Icon className="relative z-10 shrink-0" size={17} strokeWidth={2} />
                  <span className="relative z-10 min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="admin-sidebar-dot relative z-10 size-1.5 shrink-0 rounded-full bg-[var(--border)]" />
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-[var(--border-soft)] p-4">
            <Panel className="p-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">当前登录为</span>
                  <strong className="mt-1 block text-sm text-[var(--text-strong)]">{user.nickname || user.username}</strong>
                </div>
                <span
                  aria-label={`${user.username} avatar`}
                  className="block size-9 rounded-[var(--radius)] bg-[var(--surface-field)] bg-cover bg-center"
                  role="img"
                  style={backgroundImageStyle(siteBranding.defaultAvatarUrl)}
                />
              </div>
            </Panel>
            <Link className="flex h-9 items-center gap-3 rounded-[var(--radius)] px-4 text-sm text-[var(--muted)] hover:bg-[var(--surface-field)]" href="/docs">
              <CircleHelp size={16} />
              帮助
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--surface-glass)] px-4 backdrop-blur-xl md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                aria-label="CrescentLab admin logo"
                className="block size-9 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[length:16px_16px] bg-center bg-no-repeat text-[var(--cyan)] lg:hidden"
                href="/admin"
                style={backgroundImageStyle(siteBranding.adminLogoUrl)}
              />
              <div className="min-w-0">
                <span className="block font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">管理</span>
                <strong className="block truncate text-sm text-[var(--text-strong)]">CrescentLab 后台控制台</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ButtonLink className="hidden sm:inline-flex" href="/" icon={<Home size={15} />} variant="secondary">
                返回前台
              </ButtonLink>
              <ThemeToggle />
              <motion.div {...buttonPress}>
                <Button aria-label="退出登录" className="w-10 px-0" icon={<LogOut size={16} />} onClick={handleLogout} variant="secondary">
                  <span className="sr-only">退出登录</span>
                </Button>
              </motion.div>
            </div>
          </header>
          <motion.main
            animate="visible"
            initial="hidden"
            key={pathname}
            variants={fadeUp}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <motion.div {...buttonPress}>
      <Button aria-label="切换黑白主题" className="w-10 px-0" icon={<Icon size={16} />} onClick={toggleTheme} variant="secondary">
        <span className="sr-only">切换主题</span>
      </Button>
    </motion.div>
  );
}
