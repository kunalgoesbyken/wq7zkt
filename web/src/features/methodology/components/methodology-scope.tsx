"use client";

import { useTranslations } from "next-intl";
import { Stat } from "@/components/stat";
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

  if (!meta.data || !markets.data) return <Skeleton className="h-40 w-full rounded-xl" />;

  const { auction_window: auction, delivery_window: delivery, band_quantiles: [low, high] } = meta.data;

  return (
    <dl className="grid gap-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:grid-cols-2 sm:p-6">
      <Stat label={t("auctionWindow")} value={format.calendarRange(auction.start, auction.end, "dayMonthYear")} size="compact" />
      <Stat label={t("deliveryWindow")} value={format.calendarRange(delivery.start, delivery.end, "dayMonthYear")} size="compact" />
      <Stat
        label={t("datasets")}
        value={t("datasetsValue", {
          actuals: meta.data.actuals_dataset,
          fuel: meta.data.fuel_type,
          forecasts: meta.data.forecasts_dataset,
        })}
        size="compact"
      />
      <Stat
        label={t("band")}
        value={t("bandValue", { low: format.percentile(low), high: format.percentile(high) })}
        size="compact"
      />
      <div className="flex flex-col gap-1 sm:col-span-2">
        <dt className="text-xs text-muted-foreground">{t("markets")}</dt>
        {markets.data.markets.map((market) => (
          <dd key={market.id} className="figures text-base font-medium">
            {t("marketValue", { venue: market.venue, time: market.gate_closure_local, timeZone: market.timezone })}
          </dd>
        ))}
      </div>
    </dl>
  );
}
