import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Panel({ children, className, ...props }: PanelProps) {
  return (
    <section className={cn("glass-panel rounded-[var(--radius)]", className)} {...props}>
      {children}
    </section>
  );
}
