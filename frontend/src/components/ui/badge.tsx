import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  tone?: "cyan" | "purple" | "neutral" | "green";
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const tones = {
    cyan: "border-[rgba(76,215,246,0.45)] bg-[var(--cyan-soft)] text-[var(--cyan)]",
    purple: "border-[rgba(96,1,209,0.38)] bg-[var(--purple-soft)] text-[var(--lavender)]",
    neutral: "border-[rgba(70,70,76,0.55)] bg-white/5 text-[var(--muted)]",
    green: "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[#8ee6a8]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 font-lab-mono text-xs font-medium uppercase",
        "border",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
