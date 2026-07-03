import { cn } from "@/lib/utils";

export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-1.5 rounded-full",
        active ? "bg-[var(--cyan)] shadow-[0_0_8px_rgba(76,215,246,0.7)]" : "bg-[var(--muted-low)]",
      )}
    />
  );
}
