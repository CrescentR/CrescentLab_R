import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  meta?: ReactNode;
  className?: string;
};

export function Field({ label, value, multiline = false, meta, className }: FieldProps) {
  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      <span className="flex items-center justify-between font-lab-mono text-xs font-medium text-[var(--muted)]">
        <span>{label}</span>
        {meta}
      </span>
      <span
        className={cn(
          "field-surface block w-full rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--text)]",
          multiline && "min-h-28 leading-6",
        )}
      >
        {value}
      </span>
    </label>
  );
}
