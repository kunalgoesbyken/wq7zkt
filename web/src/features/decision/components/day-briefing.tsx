"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";
import { useDecisionCalendar } from "../hooks/use-decision-data";
import { DemandSplitBar } from "./demand-split-bar";

type DayBriefingProps = {
  day: Schemas["DecisionDay"];
  market: Schemas["Market"];
  lowerQuantile: number;
};

function figure(className: string) {
  function Figure(chunks: ReactNode) {
    return <strong className={cn("figures font-semibold whitespace-nowrap", className)}>{chunks}</strong>;
  }
  return Figure;
}

const figures = {
  wind: figure("text-forecast"),
  figure: figure("text-foreground"),
};

function useHeldShare(marketId: string, lowerQuantile: number) {
  const format = useFormat();
  const coverage = useDecisionCalendar(marketId).data?.band_coverage;
  if (coverage?.n) return format.ratio(coverage.at_or_above_lower_ratio);
  return format.ratio(1 - lowerQuantile);
}

export function DayBriefing({ day, market, lowerQuantile }: DayBriefingProps) {
  const t = useTranslations("decision.briefing");
  const format = useFormat();
  const held = useHeldShare(market.id, lowerQuantile);
  const { summary, gate_closure_utc: gateClosure, latest_run_utc: latestRun } = day;
  const timeZone = market.timezone;
  const hasDemand = summary.demand_forecast_gwh !== null;

  return (
    <section aria-labelledby="day-briefing" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          {t("context", {
            venue: market.venue,
            gateTime: format.dateTime(gateClosure, timeZone, "hourMinute"),
            gateDate: format.dateTime(gateClosure, timeZone, "weekdayDayMonth"),
            runTime: format.dateTime(latestRun, timeZone, "hourMinute"),
          })}
        </p>
        <h2 id="day-briefing" className="sr-only">
          {t("title")}
        </h2>
        <div className="flex max-w-[44ch] flex-col gap-3 text-[1.375rem] leading-snug tracking-tight text-pretty sm:text-[1.625rem]">
          <p>{t.rich("wind", { amount: format.gwh(summary.expected_gwh), ...figures })}</p>
          <p>{t.rich("firm", { amount: format.gwh(summary.lower_gwh), held, ...figures })}</p>
        </div>
        {hasDemand && (
          <p className="max-w-[62ch] text-base leading-relaxed text-pretty">
            {t.rich("demand", {
              demand: format.gwh(summary.demand_forecast_gwh),
              other: format.gwh(summary.net_demand_expected_gwh),
              otherPlan: format.gwh(summary.net_demand_plan_gwh),
              ...figures,
            })}
          </p>
        )}
      </div>
      <DemandSplitBar summary={summary} />
    </section>
  );
}
