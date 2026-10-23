"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";

export const riskHatch: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--risk) 0 2px, color-mix(in oklch, var(--risk) 28%, transparent) 2px 6px)",
};

type Segment = {
  key: "firm" | "risk" | "other";
  amount: number;
  className?: string;
  style?: CSSProperties;
};

function segments(summary: Schemas["DaySummary"]): Segment[] | null {
  const { lower_gwh: firm, expected_gwh: expected, net_demand_expected_gwh: other } = summary;
  if (firm === null || expected === null || other === null) return null;
  return [
    { key: "firm", amount: Math.max(firm, 0), className: "bg-forecast" },
    { key: "risk", amount: Math.max(expected - firm, 0), style: riskHatch },
    { key: "other", amount: Math.max(other, 0), className: "bg-other" },
  ];
}

export function DemandSplitBar({ summary }: { summary: Schemas["DaySummary"] }) {
  const t = useTranslations("decision.split");
  const format = useFormat();
  const parts = segments(summary);

  if (!parts) return null;

  const total = parts.reduce((sum, part) => sum + part.amount, 0) || 1;

  return (
    <figure className="flex flex-col gap-3" aria-label={t("label")}>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-sm">
        {parts.map((part) => (
          <div
            key={part.key}
            className={cn("h-full", part.className)}
            style={{ ...part.style, flexGrow: part.amount, flexBasis: 0 }}
          />
        ))}
      </div>
      <figcaption className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        {parts.map((part) => (
          <div key={part.key} className="flex items-start gap-2">
            <span aria-hidden className={cn("mt-1 size-3 shrink-0 rounded-[3px]", part.className)} style={part.style} />
            <span className="flex flex-col">
              <span>{t(part.key)}</span>
              <span className="figures text-muted-foreground">
                {t("amount", { amount: format.gwh(part.amount), share: format.ratio(part.amount / total) })}
              </span>
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
