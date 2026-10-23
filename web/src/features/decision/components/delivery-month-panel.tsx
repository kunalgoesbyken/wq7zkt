"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/section";
import { ErrorState } from "@/components/states/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Schemas } from "@/lib/api/client";
import { biasDirection } from "@/lib/bias";
import { useFormat } from "@/lib/format/use-format";
import { useDecisionCalendar } from "../hooks/use-decision-data";
import { DeliveryMonthStrip } from "./delivery-month-strip";

type DeliveryMonthPanelProps = {
  marketId: string;
  selectedDate: string;
  onSelect: (isoDate: string) => void;
};

function measuredTotals(days: Schemas["DaySummary"][]) {
  const measured = days.filter((day) => day.expected_gwh !== null && day.actual_gwh !== null);
  return {
    days: measured.length,
    forecast: measured.reduce((sum, day) => sum + (day.expected_gwh ?? 0), 0),
    actual: measured.reduce((sum, day) => sum + (day.actual_gwh ?? 0), 0),
  };
}

function MonthSummary({ calendar }: { calendar: Schemas["DecisionCalendar"] }) {
  const t = useTranslations("decision.month");
  const format = useFormat();
  const totals = measuredTotals(calendar.days);
  const bias = biasDirection(calendar.metrics.bias_mw);

  return (
    <div className="flex max-w-[66ch] flex-col gap-2 text-base leading-relaxed text-pretty">
      <p>
        {t("totals", {
          days: totals.days,
          forecast: format.gwh(totals.forecast),
          actual: format.gwh(totals.actual),
        })}{" "}
        {t(`bias.${bias}`, { bias: format.mw(Math.abs(calendar.metrics.bias_mw ?? 0)) })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("miss", { mae: format.mw(calendar.metrics.mae_mw), demandMae: format.mw(calendar.demand_metrics.mae_mw) })}
      </p>
    </div>
  );
}

export function DeliveryMonthPanel({ marketId, selectedDate, onSelect }: DeliveryMonthPanelProps) {
  const t = useTranslations("decision.month");
  const { data: calendar, error, mutate } = useDecisionCalendar(marketId);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;

  return (
    <Section title={t("title")} description={t("description")}>
      {calendar ? (
        <div className="flex flex-col gap-8">
          <MonthSummary calendar={calendar} />
          <DeliveryMonthStrip days={calendar.days} selectedDate={selectedDate} onSelect={onSelect} />
        </div>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}
    </Section>
  );
}
