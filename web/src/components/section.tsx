import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-[1.0625rem] font-semibold tracking-tight text-balance">{title}</h2>
        {description && <p className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
