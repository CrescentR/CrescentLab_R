import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  meta?: ReactNode;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  meta,
  className,
  inputClassName,
  disabled = false,
  placeholder,
}: FieldProps) {
  const fieldClassName = cn(
    "field-surface block w-full rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-[border-color,background-color,box-shadow]",
    "focus:border-[var(--blue)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--blue-soft)]",
    disabled && "cursor-not-allowed opacity-60",
    multiline && "min-h-28 leading-6",
    inputClassName,
  );

  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      <span className="flex items-center justify-between font-lab-mono text-xs font-medium text-[var(--muted)]">
        <span>{label}</span>
        {meta}
      </span>
      {onChange ? (
        multiline ? (
          <textarea
            className={fieldClassName}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        ) : (
          <input
            className={fieldClassName}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        )
      ) : (
        <span className={fieldClassName}>{value}</span>
      )}
    </label>
  );
}
