"use client";

import { useTranslations } from "next-intl";
import { Panel } from "@/components/panel";
import { ErrorState } from "@/components/states/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormat } from "@/lib/format/use-format";
import { useDecisionCalendar } from "../hooks/use-decision-data";
import { DeliveryMonthStrip } from "./delivery-month-strip";

type DeliveryMonthPanelProps = {
  marketId: string;
  selectedDate: string;
  onSelect: (isoDate: string) => void;
};

export function DeliveryMonthPanel({ marketId, selectedDate, onSelect }: DeliveryMonthPanelProps) {
  const t = useTranslations("decision.month");
  const format = useFormat();
  const { data: calendar, error, mutate } = useDecisionCalendar(marketId);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;

  return (
    <Panel
      title={t("title")}
      description={
        calendar
          ? t("description", {
              mae: format.mw(calendar.metrics.mae_mw),
              bias: format.signedMw(calendar.metrics.bias_mw),
              days: calendar.days.length,
            })
          : undefined
      }
    >
      {calendar ? (
        <DeliveryMonthStrip days={calendar.days} selectedDate={selectedDate} onSelect={onSelect} />
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
    </Panel>
  );
}
