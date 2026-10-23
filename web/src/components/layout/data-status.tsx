"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeta } from "@/lib/api/queries";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";

function StatusDot({ tone }: { tone: "ok" | "warn" | "down" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 rounded-full",
        tone === "ok" && "bg-primary",
        tone === "warn" && "bg-risk",
        tone === "down" && "bg-destructive",
      )}
    />
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="figures">{children}</dd>
    </div>
  );
}

export function DataStatus() {
  const t = useTranslations("dataStatus");
  const format = useFormat();
  const { data: meta, error } = useMeta();

  if (error) {
    return (
      <span className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
        <StatusDot tone="down" />
        {t("unavailable")}
      </span>
    );
  }

  if (!meta) return <Skeleton className="h-7 w-36" />;

  const { coverage, reporting_timezone: timeZone } = meta;
  const hasGaps = coverage.missing_actual_periods > 0;

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <StatusDot tone={hasGaps ? "warn" : "ok"} />
        <span className="hidden sm:inline">
          {t("summary", { date: format.dateTime(meta.ingested_at, timeZone, "dayMonthTime") })}
        </span>
        <span className="sr-only sm:hidden">{t("title")}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 text-xs">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="mt-1 text-muted-foreground">
          {t("sources", { actuals: meta.actuals_dataset, forecasts: meta.forecasts_dataset, fuel: meta.fuel_type })}
        </p>
        <dl className="mt-3 divide-y divide-border/70">
          <DetailRow label={t("actuals")}>
            {t("range", {
              from: format.dateTime(coverage.actuals_from, timeZone, "dayMonthTime"),
              to: format.dateTime(coverage.actuals_to, timeZone, "dayMonthTime"),
            })}
          </DetailRow>
          <DetailRow label={t("missingPeriods")}>
            {t("missingValue", {
              missing: format.count(coverage.missing_actual_periods),
              total: format.count(coverage.actual_periods),
            })}
          </DetailRow>
          <DetailRow label={t("forecastRuns")}>
            {t("runsValue", {
              count: format.count(coverage.forecast_runs),
              from: format.dateTime(coverage.forecast_runs_from, timeZone, "dayMonth"),
              to: format.dateTime(coverage.forecast_runs_to, timeZone, "dayMonth"),
            })}
          </DetailRow>
          <DetailRow label={t("ingestedAt")}>{format.dateTime(meta.ingested_at, timeZone, "dayMonthTime")}</DetailRow>
          <DetailRow label={t("timeZone")}>{timeZone}</DetailRow>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
