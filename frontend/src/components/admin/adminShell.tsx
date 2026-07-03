"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  FileText,
  Gauge,
  Home,
  Image,
  LockKeyhole,
  MessageSquare,
  Moon,
  Palette,
  PenLine,
  RadioTower,
  Settings,
  ShieldAlert,
  Sun,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import { personas } from "@/lib/personas";
import { useUiStore } from "@/store/uiStore";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { backgroundImageStyle, siteBranding } from "@/lib/site-settings";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Gauge, tone: "cyan" },
  { href: "/admin/postManagement/new", label: "Content", icon: FileText, tone: "purple" },
  { href: "/admin/media", label: "Media", icon: Image, tone: "amber" },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare, tone: "green" },
  { href: "/admin/users", label: "Users", icon: Users, tone: "rose" },
  { href: "/admin/plugins", label: "Plugins", icon: BookOpen, tone: "cyan" },
  { href: "/admin/themes", label: "Themes", icon: Palette, tone: "purple" },
  { href: "/admin/settings", label: "Settings", icon: Settings, tone: "neutral" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activePersona = useUiStore((state) => state.activePersona);
  const persona = personas[activePersona];

  if (!persona.canEnterAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface-glass)] lg:flex lg:flex-col">
          <div className="px-5 py-6">
            <Link className="flex items-center gap-3" href="/admin">
              <span
                aria-label="CrescentLab admin logo"
                className="block size-11 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[length:20px_20px] bg-center bg-no-repeat"
                role="img"
                style={backgroundImageStyle(siteBranding.adminLogoUrl)}
              />
              <span>
                <span className="block font-lab-display text-xl font-bold text-[var(--text-strong)]">CrescentLab</span>
                <span className="block font-lab-mono text-xs text-[var(--muted)]">Admin Lab Console</span>
              </span>
            </Link>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <ButtonLink href="/" icon={<ArrowLeft size={15} />} variant="secondary">
                返回前台
              </ButtonLink>
              <ButtonLink href="/admin/postManagement/new" icon={<PenLine size={15} />} variant="primary">
                New Post
              </ButtonLink>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  className={cn(
                    "group flex h-12 items-center gap-3 rounded-[var(--radius)] px-4 font-lab-mono text-sm font-medium text-[var(--muted)] transition-colors",
                    active && "border border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--text-strong)]",
                    !active && "hover:bg-[var(--surface-field)] hover:text-[var(--text)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <span className="size-1.5 rounded-full bg-[var(--border)] group-hover:bg-[var(--cyan)]" />
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-[var(--border-soft)] p-4">
            <Panel className="p-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">signed in as</span>
                  <strong className="mt-1 block text-sm text-[var(--text-strong)]">{persona.name}</strong>
                </div>
                <span
                  aria-label={`${persona.name} avatar`}
                  className="block size-9 rounded-[var(--radius)] bg-[var(--surface-field)] bg-cover bg-center"
                  role="img"
                  style={backgroundImageStyle(siteBranding.defaultAvatarUrl)}
                />
              </div>
            </Panel>
            <Link className="flex h-9 items-center gap-3 rounded-[var(--radius)] px-4 text-sm text-[var(--muted)] hover:bg-[var(--surface-field)]" href="/docs">
              <CircleHelp size={16} />
              Help
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
                <span className="block font-lab-mono text-[10px] uppercase text-[var(--muted-low)]">admin surface</span>
                <strong className="block truncate text-sm text-[var(--text-strong)]">CrescentLab operating console</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ButtonLink className="hidden sm:inline-flex" href="/" icon={<Home size={15} />} variant="secondary">
                返回前台
              </ButtonLink>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminAccessDenied() {
  const activePersona = useUiStore((state) => state.activePersona);
  const setActivePersona = useUiStore((state) => state.setActivePersona);
  const persona = personas[activePersona];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--text)] md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-glass)] px-4 py-3 backdrop-blur">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-raised)] text-[var(--cyan)]">
              <ArrowLeft size={18} />
            </span>
            <span>
              <span className="block font-lab-display text-lg font-bold text-[var(--text-strong)]">返回前台</span>
              <span className="block font-lab-mono text-xs text-[var(--muted)]">Admin requires elevated role</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6 md:p-8">
            <Badge tone="rose">Access Gate</Badge>
            <div className="mt-6 flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--rose)]">
                <ShieldAlert size={22} />
              </span>
              <div>
                <h1 className="font-lab-display text-3xl font-semibold text-[var(--text-strong)]">当前身份不能进入后台</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  你现在是 {persona.name}。普通用户可以阅读、评论、订阅和维护个人资料，但用户、插件、主题、存储、系统设置这些后台模块只开放给管理员。
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button icon={<LockKeyhole size={15} />} onClick={() => setActivePersona("admin")} variant="primary">
                切换为管理员演示
              </Button>
              <ButtonLink href="/" icon={<Home size={15} />} variant="secondary">
                回到前台
              </ButtonLink>
            </div>
          </Panel>

          <Panel className="lab-card p-5">
            <div className="flex items-center gap-2 text-[var(--cyan)]">
              <RadioTower size={18} />
              <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">共享权限</h2>
            </div>
            <div className="mt-5 space-y-3">
              {["阅读公开内容", "发表评论与回复", "维护个人资料", "订阅通知"].map((item) => (
                <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] px-3 py-2" key={item}>
                  <span className="text-sm text-[var(--text)]">{item}</span>
                  <Badge tone="green">shared</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <Button aria-label="切换黑白主题" className="w-10 px-0" icon={<Icon size={16} />} onClick={toggleTheme} variant="secondary">
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
