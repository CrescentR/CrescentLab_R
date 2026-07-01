import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variants = {
  primary: "bg-[var(--purple)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#7417df]",
  secondary: "border border-[var(--border)] text-[var(--text)] hover:border-[var(--muted-low)] hover:bg-white/5",
  ghost: "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
};

const baseClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius)] px-4 font-lab-mono text-sm font-medium transition-colors";

export function Button({ children, icon, variant = "secondary", className }: ButtonProps) {
  return (
    <button
      className={cn(baseClass, variants[variant], className)}
      type="button"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

type ButtonLinkProps = ButtonProps & {
  href: string;
};

export function ButtonLink({ children, href, icon, variant = "secondary", className }: ButtonLinkProps) {
  return (
    <Link className={cn(baseClass, variants[variant], className)} href={href}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}
