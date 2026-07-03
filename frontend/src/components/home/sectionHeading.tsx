import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  compact = false,
  description,
  eyebrow,
  icon,
  title,
}: {
  compact?: boolean;
  description?: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className={cn("grid gap-4", !compact && "md:grid-cols-[180px_1fr]")}>
      <div className="flex items-center gap-2 font-lab-mono text-xs font-semibold text-[var(--muted-low)]">
        <span className="text-[var(--teal)]">{icon}</span>
        {eyebrow}
      </div>
      <div>
        <h2 className={cn("font-lab-display font-semibold text-[var(--text-strong)]", compact ? "text-xl" : "text-3xl")}>{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
    </div>
  );
}
