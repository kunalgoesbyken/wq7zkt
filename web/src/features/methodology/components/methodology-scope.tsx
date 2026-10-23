"use client";

import { useTranslations } from "next-intl";
import { FactList } from "@/components/fact-list";
import { ErrorState } from "@/components/states/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkets, useMeta } from "@/lib/api/queries";
import { useFormat } from "@/lib/format/use-format";

export function MethodologyScope() {
  const t = useTranslations("methodology.scope");
  const format = useFormat();
  const meta = useMeta();
  const markets = useMarkets();
  const error = meta.error ?? markets.error;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          meta.mutate();
          markets.mutate();
        }}
      />
    );
  }

  if (!meta.data || !markets.data) return <Skeleton className="h-48 w-full" />;

  const { auction_window: auction, delivery_window: delivery, band_quantiles: [low, high] } = meta.data;

  return (
    <FactList
      className="sm:grid-cols-1"
      facts={[
        { label: t("auctionWindow"), value: format.calendarRange(auction.start, auction.end, "dayMonthYear") },
        { label: t("deliveryWindow"), value: format.calendarRange(delivery.start, delivery.end, "dayMonthYear") },
        {
          label: t("markets"),
          value: (
            <span className="flex flex-col">
              {markets.data.markets.map((market) => (
                <span key={market.id}>
                  {t("marketValue", { venue: market.venue, time: market.gate_closure_local, timeZone: market.timezone })}
                </span>
              ))}
            </span>
          ),
        },
        {
          label: t("wind"),
          value: t("windValue", { forecasts: meta.data.forecasts_dataset, actuals: meta.data.actuals_dataset }),
        },
        {
          label: t("demand"),
          value: t("demandValue", {
            forecasts: meta.data.demand_forecasts_dataset,
            actuals: meta.data.demand_actuals_dataset,
          }),
        },
        { label: t("band"), value: t("bandValue", { low: format.percentile(low), high: format.percentile(high) }) },
      ]}
    />
  );
}
