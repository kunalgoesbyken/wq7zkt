import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Fact = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
};

export function FactList({ facts, className }: { facts: Fact[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-12 sm:grid-cols-2", className)}>
      {facts.map(({ label, value, note }) => (
        <div key={label} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-4 border-b py-3 text-sm">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="flex flex-col gap-0.5">
            <span className="figures font-medium">{value}</span>
            {note && <div className="leading-snug text-muted-foreground">{note}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
