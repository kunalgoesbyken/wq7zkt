"use client";

import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { ChartLegend } from "@/components/charts/chart-legend";
import {
  axisTooltip,
  categoryAxis,
  chartConfig,
  chartGrid,
  seriesColor,
  tooltipHtml,
  valueAxis,
} from "@/components/charts/chart-kit";
import { EChart, type OptionBuilder } from "@/components/charts/echart";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";

echarts.use([LineChart, GridComponent, TooltipComponent]);

type AccuracySeriesChartProps = {
  series: Schemas["AccuracyPoint"][];
  timeZone: string;
};

const hoursPerDay = 24;

export function AccuracySeriesChart({ series, timeZone }: AccuracySeriesChartProps) {
  const t = useTranslations("accuracy.series");
  const format = useFormat();
  const config = useMemo(() => chartConfig({ forecast: t("forecast"), actual: t("actual") }), [t]);

  const buildOption = useCallback<OptionBuilder>(
    (colors) => ({
        grid: chartGrid(),
        tooltip: axisTooltip(colors, (index) => {
          const point = series[index];
          return tooltipHtml(format.dateTime(point.start_time, timeZone, "dayMonthTime"), [
            { label: t("forecast"), value: format.mw(point.forecast_mw), series: "forecast" },
            { label: t("actual"), value: format.mw(point.actual_mw), series: "actual" },
            { label: t("error"), value: format.signedMw(point.error_mw) },
          ]);
        }),
        xAxis: categoryAxis(
          colors,
          series.map((point) => format.dateTime(point.start_time, timeZone, "dayMonth")),
          { labelInterval: (index) => index % hoursPerDay === 0 },
        ),
        yAxis: valueAxis(colors, (value) => format.gw(value, 0)),
        series: [
          {
            id: "actual",
            type: "line",
            data: series.map((point) => point.actual_mw),
            symbol: "none",
            sampling: "lttb",
            lineStyle: { color: seriesColor(colors, "actual"), width: 1.25 },
          },
          {
            id: "forecast",
            type: "line",
            data: series.map((point) => point.forecast_mw),
            symbol: "none",
            sampling: "lttb",
            lineStyle: { color: seriesColor(colors, "forecast"), width: 1.75 },
          },
        ],
      }),
    [format, series, t, timeZone],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("forecast"), swatch: "line", colorClass: "bg-forecast" },
          { label: t("actual"), swatch: "line", colorClass: "bg-actual" },
        ]}
      />
      <EChart config={config} buildOption={buildOption} label={t("ariaLabel")} className="h-72 w-full lg:h-80" />
    </div>
  );
}
