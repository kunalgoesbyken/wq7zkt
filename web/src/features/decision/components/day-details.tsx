"use client";

import { useTranslations } from "next-intl";
import { FactList } from "@/components/fact-list";
import { Section } from "@/components/section";
import type { Schemas } from "@/lib/api/client";
import { biasDirection } from "@/lib/bias";
import { hoursBetween } from "@/lib/dates";
import { useFormat } from "@/lib/format/use-format";
import { QualityFlags } from "./quality-flags";

type DayDetailsProps = {
  day: Schemas["DecisionDay"];
  market: Schemas["Market"];
};

export function DayDetails({ day, market }: DayDetailsProps) {
  const t = useTranslations("decision.details");
  const format = useFormat();
  const { summary, latest_run_utc: latestRun, gate_closure_utc: gateClosure } = day;
  const timeZone = market.timezone;
  const bias = biasDirection(summary.bias_mw);

  return (
    <Section title={t("title")}>
      <FactList
        facts={[
          {
            label: t("deadline"),
            value: t("deadlineValue", {
              time: format.dateTime(gateClosure, timeZone, "hourMinute"),
              date: format.dateTime(gateClosure, timeZone, "weekdayDayMonth"),
            }),
            note: market.venue,
          },
          {
            label: t("forecastUsed"),
            value: latestRun ? t("forecastUsedValue", { time: format.dateTime(latestRun, timeZone, "hourMinute") }) : t("noRun"),
            note: latestRun ? t("forecastUsedNote", { age: format.duration(hoursBetween(latestRun, gateClosure)) }) : undefined,
          },
          {
            label: t("hours"),
            value: t("hoursValue", {
              forecast: format.count(summary.hours_forecast),
              total: format.count(summary.hours_total),
            }),
            note: <QualityFlags flags={summary.flags} />,
          },
          {
            label: t("miss"),
            value: format.mw(summary.mae_mw),
            note: t("missNote"),
          },
          {
            label: t("bias"),
            value: format.signedMw(summary.bias_mw),
            note: t(`biasNote.${bias}`),
          },
          {
            label: t("range"),
            value: t("rangeValue", { days: day.calibration_days }),
            note: t("rangeNote"),
          },
        ]}
      />
    </Section>
  );
}
