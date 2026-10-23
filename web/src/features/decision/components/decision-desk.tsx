"use client";

import { useTranslations } from "next-intl";
import { MarketToggle } from "@/components/market-toggle";
import { PageIntro } from "@/components/page-intro";
import { ErrorState } from "@/components/states/error-state";
import { useMarketSelection } from "@/hooks/use-market-selection";
import { useMeta } from "@/lib/api/queries";
import { useDeliveryDate } from "../hooks/use-delivery-date";
import { DecisionDayView } from "./decision-day-view";
import { DecisionDeskSkeleton } from "./decision-skeleton";
import { DeliveryDatePicker } from "./delivery-date-picker";
import { DeliveryMonthPanel } from "./delivery-month-panel";

export function DecisionDesk() {
  const t = useTranslations("decision");
  const { market, markets, selectMarket, error: marketsError, retry: retryMarkets } = useMarketSelection();
  const { deliveryDate, deliveryWindow, selectDate } = useDeliveryDate();
  const { data: meta, error: metaError, mutate: retryMeta } = useMeta();

  const setupError = marketsError ?? metaError;
  if (setupError) {
    return (
      <ErrorState
        error={setupError}
        onRetry={() => {
          retryMarkets();
          retryMeta();
        }}
      />
    );
  }

  if (!market || !meta || !deliveryDate || !deliveryWindow) return <DecisionDeskSkeleton />;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <PageIntro title={t("title")} description={t("intro")} />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <MarketToggle markets={markets} value={market.id} onChange={selectMarket} />
          <DeliveryDatePicker value={deliveryDate} deliveryWindow={deliveryWindow} onChange={selectDate} />
        </div>
      </div>
      <div className="border-t pt-10">
        <DecisionDayView market={market} deliveryDate={deliveryDate} bandQuantiles={meta.band_quantiles} />
      </div>
      <div className="border-t pt-10">
        <DeliveryMonthPanel marketId={market.id} selectedDate={deliveryDate} onSelect={selectDate} />
      </div>
    </div>
  );
}
