"use client";

import { useTranslations } from "next-intl";
import { Panel } from "@/components/panel";
import { EmptyState } from "@/components/states/empty-state";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { AccuracyMetrics } from "./accuracy-metrics";
import { AccuracySeriesChart } from "./accuracy-series-chart";
import { ErrorHistogramChart } from "./error-histogram-chart";
import { HorizonCurvePanel } from "./horizon-curve-panel";
import { HourlyErrorChart } from "./hourly-error-chart";

type AccuracyReportViewProps = {
  report: Schemas["AccuracyReport"];
  timeZone: string;
};

export function AccuracyReportView({ report, timeZone }: AccuracyReportViewProps) {
  const t = useTranslations("accuracy");
  const format = useFormat();

  if (report.metrics.n === 0) {
    return <EmptyState title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <AccuracyMetrics metrics={report.metrics} />
      <Panel
        title={t("series.title")}
        description={t("window", {
          start: format.calendarDate(report.window.start, "dayMonth"),
          end: format.calendarDate(report.window.end, "dayMonth"),
          hours: format.count(report.metrics.n),
          timeZone,
        })}
      >
        <AccuracySeriesChart series={report.series} timeZone={timeZone} />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <HorizonCurvePanel selectedHorizon={report.horizon_h} />
        <Panel title={t("histogram.title")} description={t("histogram.description")}>
          <ErrorHistogramChart bins={report.histogram} />
        </Panel>
      </div>
      <Panel title={t("byHour.title")} description={t("byHour.description", { timeZone })}>
        <HourlyErrorChart hours={report.by_hour} />
      </Panel>
    </div>
  );
}
