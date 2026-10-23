"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";
import { useDecisionDay } from "../hooks/use-decision-data";
import { DayBriefing } from "./day-briefing";
import { DayDetails } from "./day-details";
import { DayOutcome } from "./day-outcome";
import { DecisionChart } from "./decision-chart";
import { DecisionDaySkeleton } from "./decision-skeleton";
import { DemandChart } from "./demand-chart";

type DecisionDayViewProps = {
  market: Schemas["Market"];
  deliveryDate: string;
  bandQuantiles: [number, number];
};

export function DecisionDayView({ market, deliveryDate, bandQuantiles }: DecisionDayViewProps) {
  const t = useTranslations("decision");
  const format = useFormat();
  const { data: day, error, mutate, isValidating } = useDecisionDay(market.id, deliveryDate);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (!day) return <DecisionDaySkeleton />;

  if (day.summary.hours_forecast === 0) {
    return <EmptyState title={t("empty.title")} description={t("empty.description")} />;
  }

  const deliveryRange = {
    start: format.dateTime(day.delivery_start_utc, market.timezone, "dayMonthTime"),
    end: format.dateTime(day.delivery_end_utc, market.timezone, "dayMonthTime"),
  };
  const hasDemand = day.summary.demand_forecast_gwh !== null;

  return (
    <div aria-busy={isValidating} className={cn("flex flex-col gap-14 transition-opacity", isValidating && "opacity-60")}>
      <DayBriefing day={day} market={market} lowerQuantile={bandQuantiles[0]} />
      <Section title={t("chart.title")} description={t("chart.description", deliveryRange)}>
        <DecisionChart hours={day.hours} timeZone={market.timezone} bandQuantiles={bandQuantiles} />
      </Section>
      {hasDemand && (
        <Section title={t("demandChart.title")} description={t("demandChart.description")}>
          <DemandChart hours={day.hours} timeZone={market.timezone} />
        </Section>
      )}
      <DayOutcome summary={day.summary} />
      <DayDetails day={day} market={market} />
    </div>
  );
}
