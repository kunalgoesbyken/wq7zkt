"use client";

import { useTranslations } from "next-intl";
import { Panel } from "@/components/panel";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";
import { useDecisionDay } from "../hooks/use-decision-data";
import { DecisionChart } from "./decision-chart";
import { DecisionFacts } from "./decision-facts";
import { DecisionHeadline } from "./decision-headline";
import { DecisionDaySkeleton } from "./decision-skeleton";

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

  const hasForecast = day.summary.hours_forecast > 0;

  return (
    <div aria-busy={isValidating} className={cn("flex flex-col gap-6 transition-opacity", isValidating && "opacity-60")}>
      {hasForecast ? (
        <div className="grid gap-x-10 gap-y-8 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-7 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <DecisionHeadline marketId={market.id} summary={day.summary} lowerQuantile={bandQuantiles[0]} />
          </div>
          <div className="border-t pt-8 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <DecisionFacts day={day} market={market} />
          </div>
        </div>
      ) : (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      )}
      <Panel
        title={t("chart.title")}
        description={t("chart.description", {
          start: format.dateTime(day.delivery_start_utc, market.timezone, "dayMonthTime"),
          end: format.dateTime(day.delivery_end_utc, market.timezone, "dayMonthTime"),
          timeZone: market.timezone,
        })}
      >
        <DecisionChart hours={day.hours} timeZone={market.timezone} bandQuantiles={bandQuantiles} />
      </Panel>
    </div>
  );
}
