"use client";

import { useTranslations } from "next-intl";
import { MarketToggle } from "@/components/market-toggle";
import { PageIntro } from "@/components/page-intro";
import { ErrorState } from "@/components/states/error-state";
import { useMeta } from "@/lib/api/queries";
import { useAccuracyReport, useAccuracySelection } from "../hooks/use-accuracy-data";
import { AccuracyReportSection } from "./accuracy-report-section";
import { AccuracyViewSkeleton } from "./accuracy-skeleton";
import { BasisToggle } from "./basis-toggle";
import { HorizonSlider } from "./horizon-slider";

export function AccuracyView() {
  const t = useTranslations("accuracy");
  const { basis, horizon, setParams, marketSelection, query } = useAccuracySelection();
  const { data: meta, error: metaError, mutate: retryMeta } = useMeta();
  const { data: report, error: reportError, mutate: retryReport } = useAccuracyReport(query);
  const { market, markets, selectMarket } = marketSelection;

  const setupError = metaError ?? marketSelection.error;
  if (setupError) {
    return (
      <ErrorState
        error={setupError}
        onRetry={() => {
          retryMeta();
          marketSelection.retry();
        }}
      />
    );
  }

  const activeBasis = basis ?? report?.basis;
  const activeHorizon = horizon ?? report?.horizon_h ?? null;

  if (!meta || !market || !activeBasis) {
    return reportError ? <ErrorState error={reportError} onRetry={() => retryReport()} /> : <AccuracyViewSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageIntro title={t("title")} description={t("intro")} />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <BasisToggle value={activeBasis} onChange={(nextBasis) => setParams({ basis: nextBasis })} />
          {activeBasis === "gate_closure" ? (
            <MarketToggle markets={markets} value={market.id} onChange={selectMarket} />
          ) : (
            activeHorizon !== null && (
              <HorizonSlider
                value={activeHorizon}
                max={meta.max_horizon_h}
                onCommit={(hours) => setParams({ horizon: hours })}
              />
            )
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t(`basisHint.${activeBasis}`)}</p>
      </div>
      <AccuracyReportSection query={query} timeZone={meta.reporting_timezone} />
    </div>
  );
}
