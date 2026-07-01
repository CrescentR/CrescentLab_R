"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  FileText,
  Gauge,
  Image,
  LogOut,
  MessageSquare,
  Palette,
  PenLine,
  Settings,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/post-management/new", label: "Content", icon: FileText },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plugins", label: "Plugins", icon: BookOpen },
  { href: "/admin/themes", label: "Themes", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface)] lg:flex lg:flex-col">
          <div className="px-5 py-7">
            <Link className="flex items-center gap-3" href="/admin">
              <span className="grid size-10 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-raised)] text-[var(--cyan)]">
                <PenLine size={18} strokeWidth={2} />
              </span>
              <span>
                <span className="block font-lab-display text-xl font-bold text-[var(--text-strong)]">CrescentLab</span>
                <span className="block font-lab-mono text-xs text-[var(--muted)]">Admin Console</span>
              </span>
            </Link>
            <ButtonLink className="mt-6 w-full" href="/admin/post-management/new" icon={<PenLine size={15} />} variant="primary">
              New Post
            </ButtonLink>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-[var(--radius)] px-4 font-lab-mono text-sm font-medium text-[var(--muted)] transition-colors",
                    active && "border border-[rgba(96,1,209,0.45)] bg-[var(--purple)] text-[var(--lavender)]",
                    !active && "hover:bg-white/5 hover:text-[var(--text)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[var(--border-soft)] p-4">
            <Link className="flex h-9 items-center gap-3 rounded-[var(--radius)] px-4 text-sm text-[var(--muted)] hover:bg-white/5" href="/docs">
              <CircleHelp size={16} />
              Help
            </Link>
            <Link className="mt-1 flex h-9 items-center gap-3 rounded-[var(--radius)] px-4 text-sm text-[var(--muted)] hover:bg-white/5" href="/">
              <LogOut size={16} />
              Logout
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b border-[var(--border-soft)] bg-[rgba(16,20,21,0.78)] px-4 backdrop-blur lg:hidden">
            <Link className="flex items-center gap-2 font-lab-display font-bold" href="/admin">
              <PenLine size={18} className="text-[var(--cyan)]" />
              CrescentLab
            </Link>
            <Link className="font-lab-mono text-sm text-[var(--cyan)]" href="/admin/post-management/new">
              New Post
            </Link>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
