"use client";

import { useTranslations } from "next-intl";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";

const headroom = 1.08;

const riskHatch = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--risk) 0 2px, color-mix(in oklch, var(--risk) 30%, transparent) 2px 6px)",
};

function share(value: number, scale: number) {
  return `${(Math.max(value, 0) / scale) * 100}%`;
}

export function FirmnessBar({ summary }: { summary: Schemas["DaySummary"] }) {
  const t = useTranslations("decision.headline");
  const format = useFormat();
  const { lower_gwh: lower, expected_gwh: expected, actual_gwh: actual } = summary;

  if (lower === null || expected === null) return null;

  const scale = Math.max(expected, actual ?? 0) * headroom;

  return (
    <figure className="flex flex-col gap-2" aria-label={t("barLabel")}>
      <div className="relative h-3 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-forecast" style={{ width: share(lower, scale) }} />
        <div
          className="absolute inset-y-0 rounded-r-full"
          style={{ left: share(lower, scale), width: share(expected - lower, scale), ...riskHatch }}
        />
        {actual !== null && (
          <div
            className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-actual"
            style={{ left: share(actual, scale) }}
          />
        )}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-forecast" />
          {t("legendFirm")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={riskHatch} />
          {t("legendRisk")}
        </span>
        {actual !== null && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-0.5 rounded-full bg-actual" />
            {t("legendActual", { amount: format.gwh(actual) })}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
