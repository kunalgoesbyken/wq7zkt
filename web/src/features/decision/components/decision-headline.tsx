"use client";

import { useTranslations } from "next-intl";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { useDecisionCalendar } from "../hooks/use-decision-data";
import { FirmnessBar } from "./firmness-bar";

type DecisionHeadlineProps = {
  marketId: string;
  summary: Schemas["DaySummary"];
  lowerQuantile: number;
};

function useFirmCaption(marketId: string, lowerQuantile: number) {
  const t = useTranslations("decision.headline");
  const format = useFormat();
  const coverage = useDecisionCalendar(marketId).data?.band_coverage;
  const target = format.ratio(1 - lowerQuantile);

  if (!coverage?.n) return t("firmTarget", { target });
  return t("firmCaption", { held: format.ratio(coverage.at_or_above_lower_ratio), hours: coverage.n, target });
}

export function DecisionHeadline({ marketId, summary, lowerQuantile }: DecisionHeadlineProps) {
  const t = useTranslations("decision.headline");
  const format = useFormat();
  const firmCaption = useFirmCaption(marketId, lowerQuantile);
  const riskShare =
    summary.energy_at_risk_gwh !== null && summary.expected_gwh ? summary.energy_at_risk_gwh / summary.expected_gwh : null;

  return (
    <section aria-labelledby="decision-headline" className="flex flex-col gap-6">
      <h2 id="decision-headline" className="sr-only">
        {t("title")}
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:gap-x-10">
        <p className="text-sm text-muted-foreground">{t("planOn")}</p>
        <p className="text-sm text-muted-foreground">{t("not")}</p>
        <p className="figures text-[1.75rem] leading-none font-semibold whitespace-nowrap tracking-tight min-[400px]:text-[2.25rem] sm:text-[3rem] lg:text-[2.25rem] xl:text-[3rem]">
          {format.gwh(summary.lower_gwh)}
        </p>
        <p className="figures text-[1.75rem] leading-none font-light whitespace-nowrap tracking-tight text-muted-foreground min-[400px]:text-[2.25rem] sm:text-[3rem] lg:text-[2.25rem] xl:text-[3rem]">
          {format.gwh(summary.expected_gwh)}
        </p>
        <p className="mt-2 max-w-[28ch] text-sm leading-snug text-muted-foreground">{firmCaption}</p>
        <p className="mt-2 max-w-[28ch] text-sm leading-snug text-muted-foreground">{t("expectedCaption")}</p>
      </div>
      <FirmnessBar summary={summary} />
      <p className="text-sm">
        {t.rich("atRisk", {
          amount: format.gwh(summary.energy_at_risk_gwh),
          share: format.ratio(riskShare),
          figure: (chunks) => <span className="figures font-semibold text-risk-foreground">{chunks}</span>,
        })}
      </p>
    </section>
  );
}
