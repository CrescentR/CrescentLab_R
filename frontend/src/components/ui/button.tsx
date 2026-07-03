import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-[var(--blue)] text-white shadow-[var(--shadow-tight)] hover:bg-[var(--teal)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] hover:border-[var(--text-strong)] hover:bg-[var(--surface-raised)]",
  ghost: "text-[var(--muted)] hover:bg-[var(--surface-field)] hover:text-[var(--text-strong)]",
};

const baseClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-4 font-lab-mono text-sm font-medium transition-[background,border-color,color,filter,transform] disabled:cursor-not-allowed disabled:opacity-45";

export function Button({ children, icon, variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(baseClass, variants[variant], className)}
      type={type}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function ButtonLink({ children, href, icon, variant = "secondary", className, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(baseClass, variants[variant], className)} href={href} {...props}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}
