import Link from "next/link";
import { ChevronDown, FlaskConical, Moon, Search, Sun, UserRound } from "lucide-react";
import type { Persona } from "@/lib/personas";
import type { PersonaRole, ThemeMode } from "@/store/uiStore";
import type { HomeNavItem } from "@/types/home";
import { Button } from "@/components/ui/button";

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
      <div className="home-container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--teal)]">
            <FlaskConical size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-lab-display text-xl font-semibold text-[var(--text-strong)]">CrescentLab</span>
            <span className="block truncate font-lab-mono text-xs text-[var(--muted)]">安和鱼的内容实验室</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="主导航">
          {navItems.map((item) => (
            <Link className="font-lab-mono text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text-strong)]" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button aria-label="搜索" className="hidden w-10 px-0 md:inline-flex" icon={<Search size={16} />} variant="ghost">
            <span className="sr-only">搜索</span>
          </Button>
          <Button aria-label="切换主题" className="w-10 px-0" icon={<ThemeIcon size={16} />} onClick={onToggleTheme} variant="secondary">
            <span className="sr-only">切换主题</span>
          </Button>

          <div className="relative">
            <Button
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
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--surface-raised)] font-lab-mono text-xs text-[var(--text-strong)]">
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
    </header>
  );
}
