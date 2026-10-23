"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/section";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";

function windOutcome({ actual_gwh: actual, expected_gwh: expected, lower_gwh: firm }: Schemas["DaySummary"]) {
  if (actual === null || expected === null || firm === null) return null;
  return {
    actual,
    gap: Math.abs(expected - actual),
    direction: actual > expected ? "more" : "less",
    firm: actual >= firm ? "above" : "below",
  } as const;
}

export function DayOutcome({ summary }: { summary: Schemas["DaySummary"] }) {
  const t = useTranslations("decision.outcome");
  const format = useFormat();
  const wind = windOutcome(summary);

  return (
    <Section title={t("title")}>
      {wind ? (
        <div className="flex max-w-[66ch] flex-col gap-2 text-base leading-relaxed text-pretty">
          <p>
            {t(`wind.${wind.direction}`, { actual: format.gwh(wind.actual), gap: format.gwh(wind.gap) })}{" "}
            {t(`firm.${wind.firm}`)}
          </p>
          {summary.demand_actual_gwh !== null && (
            <p>
              {t("demand", {
                demand: format.gwh(summary.demand_actual_gwh),
                other: format.gwh(summary.net_demand_actual_gwh),
              })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("pending")}</p>
      )}
    </Section>
  );
}
