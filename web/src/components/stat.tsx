import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatProps = {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: "default" | "risk";
  size?: "default" | "compact";
  className?: string;
};

export function Stat({ label, value, caption, tone = "default", size = "default", className }: StatProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "figures leading-tight font-medium",
          size === "default" ? "text-xl" : "text-base",
          tone === "risk" && "text-risk-foreground",
        )}
      >
        {value}
      </dd>
      {caption && <dd className="text-xs leading-snug text-muted-foreground">{caption}</dd>}
    </div>
  );
}
