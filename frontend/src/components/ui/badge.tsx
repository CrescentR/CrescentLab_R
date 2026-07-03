import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  tone?: "cyan" | "purple" | "neutral" | "green" | "amber" | "rose";
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const tones = {
    cyan: "border-[rgba(45,135,129,0.28)] bg-[var(--cyan-soft)] text-[var(--cyan)]",
    purple: "border-[rgba(107,91,141,0.28)] bg-[var(--purple-soft)] text-[var(--purple)]",
    neutral: "border-[var(--border-soft)] bg-[var(--surface-raised)] text-[var(--muted)]",
    green: "border-[rgba(95,127,82,0.3)] bg-[var(--success-soft)] text-[var(--success)]",
    amber: "border-[rgba(191,122,43,0.3)] bg-[var(--amber-soft)] text-[var(--amber)]",
    rose: "border-[rgba(183,101,109,0.3)] bg-[var(--rose-soft)] text-[var(--rose)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] px-2 py-1 font-lab-mono text-xs font-medium uppercase",
        "border",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
