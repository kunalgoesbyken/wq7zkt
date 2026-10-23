"use client";

import { useTranslations } from "next-intl";
import { Stat } from "@/components/stat";
import type { Schemas } from "@/lib/api/client";
import { biasDirection } from "@/lib/bias";
import { hoursBetween } from "@/lib/dates";
import { useFormat } from "@/lib/format/use-format";
import { QualityFlags } from "./quality-flags";

type DecisionFactsProps = {
  day: Schemas["DecisionDay"];
  market: Schemas["Market"];
};

export function DecisionFacts({ day, market }: DecisionFactsProps) {
  const t = useTranslations("decision.facts");
  const format = useFormat();
  const { summary, latest_run_utc: latestRun, gate_closure_utc: gateClosure } = day;
  const timeZone = market.timezone;
  const bias = biasDirection(summary.bias_mw);

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
      <Stat
        label={t("gateClosure")}
        value={format.dateTime(gateClosure, timeZone, "hourMinute")}
        caption={t("gateClosureCaption", {
          date: format.dateTime(gateClosure, timeZone, "weekdayDayMonth"),
          venue: market.venue,
        })}
      />
      <Stat
        label={t("forecastRun")}
        value={format.dateTime(latestRun, timeZone, "hourMinute")}
        caption={
          latestRun
            ? t("forecastRunCaption", { age: format.duration(hoursBetween(latestRun, gateClosure)) })
            : t("noRun")
        }
      />
      <Stat
        label={t("coverage")}
        value={t("coverageValue", {
          forecast: format.count(summary.hours_forecast),
          total: format.count(summary.hours_total),
        })}
        caption={<QualityFlags flags={summary.flags} />}
      />
      <Stat
        label={t("mae")}
        value={format.mw(summary.mae_mw)}
        caption={t("maeCaption", { actual: format.gwh(summary.actual_gwh) })}
      />
      <Stat
        label={t("bias")}
        value={format.signedMw(summary.bias_mw)}
        tone={bias === "over" ? "risk" : "default"}
        caption={t(`biasCaption.${bias}`)}
      />
      <Stat
        label={t("calibration")}
        value={t("calibrationValue", { days: day.calibration_days })}
        caption={t("calibrationCaption")}
      />
    </dl>
  );
}
