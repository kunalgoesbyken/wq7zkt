"use client";

import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { ChartLegend } from "@/components/charts/chart-legend";
import {
  axisTooltip,
  bandColor,
  categoryAxis,
  chartConfig,
  chartGrid,
  seriesColor,
  tooltipHtml,
  valueAxis,
  type TooltipLine,
} from "@/components/charts/chart-kit";
import { EChart, type OptionBuilder } from "@/components/charts/echart";
import { withAlpha } from "@/components/evilcharts/ui/echarts-chart";
import type { Schemas } from "@/lib/api/client";
import { addHours } from "@/lib/dates";
import { useFormat } from "@/lib/format/use-format";

echarts.use([LineChart, GridComponent, TooltipComponent]);

type DecisionHour = Schemas["DecisionHour"];

const bandStack = "band";

function bandWidth({ lower_mw: lower, upper_mw: upper }: DecisionHour) {
  return lower === null || upper === null ? null : upper - lower;
}

type DecisionChartProps = {
  hours: DecisionHour[];
  timeZone: string;
  bandQuantiles: [number, number];
};

export function DecisionChart({ hours, timeZone, bandQuantiles }: DecisionChartProps) {
  const t = useTranslations("decision.chart");
  const tFlags = useTranslations("flags");
  const format = useFormat();
  const [lowQuantile, highQuantile] = bandQuantiles;
  const bandLabel = t("band", { low: format.percentile(lowQuantile), high: format.percentile(highQuantile) });

  const config = useMemo(
    () => chartConfig({ forecast: t("forecast"), actual: t("actual"), risk: t("fallback") }),
    [t],
  );

  const describeHour = useCallback(
    (hour: DecisionHour) => {
      const title = t("hourRange", {
        start: format.dateTime(hour.start_time, timeZone, "hourMinute"),
        end: format.dateTime(addHours(hour.start_time, 1), timeZone, "hourMinute"),
      });
      const lines: TooltipLine[] = [
        { label: t("forecast"), value: format.mw(hour.forecast_mw), series: "forecast" },
        {
          label: bandLabel,
          value: t("bandRange", { lower: format.mw(hour.lower_mw), upper: format.mw(hour.upper_mw) }),
        },
        { label: t("actual"), value: format.mw(hour.actual_mw), series: "actual" },
        { label: t("error"), value: format.signedMw(hour.error_mw) },
        { label: t("sourceRun"), value: format.dateTime(hour.source_publish_time, timeZone, "dayMonthTime") },
        { label: t("age"), value: format.duration(hour.forecast_age_h) },
      ];
      const flags = format.list(hour.flags.map((flag) => tFlags(`${flag}.label`)));
      return tooltipHtml(title, lines, hour.flags.length > 0 ? t("flagsNote", { flags }) : undefined);
    },
    [bandLabel, format, t, tFlags, timeZone],
  );

  const buildOption = useCallback<OptionBuilder>(
    (colors) => {
      const forecast = seriesColor(colors, "forecast");
      const risk = seriesColor(colors, "risk");
      const background = colors.tokens.background;

      return {
        grid: chartGrid(),
        tooltip: axisTooltip(colors, (index) => describeHour(hours[index])),
        xAxis: categoryAxis(
          colors,
          hours.map((hour) => format.dateTime(hour.start_time, timeZone, "hourMinute")),
        ),
        yAxis: valueAxis(colors, (value) => format.gw(value, 0)),
        series: [
          {
            id: "lower",
            type: "line",
            stack: bandStack,
            data: hours.map((hour) => hour.lower_mw),
            symbol: "none",
            silent: true,
            lineStyle: { color: withAlpha(forecast, 0.55), width: 1, type: [4, 3] },
          },
          {
            id: "band",
            type: "line",
            stack: bandStack,
            data: hours.map(bandWidth),
            symbol: "none",
            silent: true,
            lineStyle: { width: 0 },
            areaStyle: { color: bandColor(colors) },
          },
          {
            id: "actual",
            type: "line",
            data: hours.map((hour) => hour.actual_mw),
            symbol: "none",
            lineStyle: { color: seriesColor(colors, "actual"), width: 1.5 },
            emphasis: { disabled: true },
          },
          {
            id: "forecast",
            type: "line",
            data: hours.map((hour) => ({
              value: hour.forecast_mw,
              symbol: hour.flags.includes("FALLBACK_RUN") ? "circle" : "none",
            })),
            symbolSize: 7,
            itemStyle: { color: background, borderColor: risk, borderWidth: 2 },
            lineStyle: { color: forecast, width: 2.25 },
            emphasis: { disabled: true },
          },
        ],
      };
    },
    [describeHour, format, hours, timeZone],
  );

  const hasFallback = hours.some((hour) => hour.flags.includes("FALLBACK_RUN"));

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("forecast"), swatch: "line", colorClass: "bg-forecast" },
          { label: bandLabel, swatch: "band", colorClass: "bg-forecast" },
          { label: t("lower"), swatch: "dashed", colorClass: "border-forecast/60" },
          { label: t("actual"), swatch: "line", colorClass: "bg-actual" },
          ...(hasFallback ? [{ label: t("fallback"), swatch: "bar" as const, colorClass: "rounded-full border-2 border-risk" }] : []),
        ]}
      />
      <EChart
        config={config}
        buildOption={buildOption}
        label={t("ariaLabel")}
        className="h-72 w-full sm:h-80 lg:h-[22rem]"
      />
    </div>
  );
}
