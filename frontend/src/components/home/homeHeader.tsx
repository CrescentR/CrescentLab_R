import Link from "next/link";
import { ChevronDown, LayoutDashboard, Moon, Search, Sun, UserRound } from "lucide-react";
import type { Persona } from "@/lib/personas";
import type { PersonaRole, ThemeMode } from "@/store/uiStore";
import type { HomeNavItem } from "@/types/home";
import { Button, ButtonLink } from "@/components/ui/button";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

type PersonaOption = Pick<Persona, "description" | "id" | "initials" | "name">;

export function HomeHeader({
  activePersona,
  loginPanelOpen,
  navItems,
  onSelectPersona,
  onToggleLogin,
  onToggleTheme,
  persona,
  personaOptions,
  theme,
}: {
  activePersona: PersonaRole;
  loginPanelOpen: boolean;
  navItems: HomeNavItem[];
  onSelectPersona: (role: PersonaRole) => void;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  persona: Persona;
  personaOptions: PersonaOption[];
  theme: ThemeMode;
}) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="home-header" data-lab-animate>
      <div className="home-container">
        <div className="home-header-shell">
          <Link className="home-brand" href="/">
            <span className="home-brand-mark">
              <Moon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-lab-display text-xl font-semibold text-[var(--text-strong)]">Crescent Index</span>
              <span className="block truncate font-lab-mono text-xs text-[var(--muted)]">项目、动态与技术笔记</span>
            </span>
          </Link>

          <nav className="home-nav" aria-label="主导航">
            {navItems.map((item, index) => (
              <Link className={index === 0 ? "home-nav-link home-nav-link--active" : "home-nav-link"} href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="home-header-actions">
            <Button aria-label="搜索" className="hidden size-11 rounded-[8px] px-0 md:inline-flex" icon={<Search size={16} />} variant="ghost">
              <span className="sr-only">搜索</span>
            </Button>
            <Button aria-label="切换主题" className="size-11 rounded-[8px] px-0" icon={<ThemeIcon size={16} />} onClick={onToggleTheme} variant="ghost">
              <span className="sr-only">切换主题</span>
            </Button>

            <div className="home-permission-cluster">
              {persona.canEnterAdmin && (
                <ButtonLink className="h-11 rounded-[8px] px-3 text-xs" href={`${adminUrl}/admin`} icon={<LayoutDashboard size={14} />} variant="primary">
                  后台
                </ButtonLink>
              )}

              <div className="relative">
                <Button
                  className="h-11 rounded-[8px] px-3 text-xs"
                  icon={activePersona === "guest" ? <UserRound size={15} /> : <ChevronDown size={15} />}
                  onClick={onToggleLogin}
                  variant={activePersona === "guest" ? "primary" : "secondary"}
                >
                  {activePersona === "guest" ? "登录" : persona.name}
                </Button>

                {loginPanelOpen && (
                  <div className="home-account-menu">
                    <div className="px-2 pb-3">
                      <span className="font-lab-mono text-xs text-[var(--muted-low)]">preview account</span>
                      <h2 className="mt-1 font-lab-display text-lg font-semibold text-[var(--text-strong)]">选择一个身份</h2>
                    </div>
                    <div className="grid gap-2">
                      {personaOptions.map((option) => (
                        <button className="home-account-option" key={option.id} onClick={() => onSelectPersona(option.id)} type="button">
                          <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[var(--surface-raised)] font-lab-mono text-xs text-[var(--text-strong)]">
                            {option.initials}
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-[var(--text-strong)]">{option.name}</span>
                            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{option.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button className="mt-3 w-full" onClick={() => onSelectPersona("guest")} variant="ghost">
                      退回访客
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
