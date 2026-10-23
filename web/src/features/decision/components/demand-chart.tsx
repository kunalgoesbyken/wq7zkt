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
  type TooltipLine,
} from "@/components/charts/chart-kit";
import { EChart, type OptionBuilder } from "@/components/charts/echart";
import { withAlpha } from "@/components/evilcharts/ui/echarts-chart";
import type { Schemas } from "@/lib/api/client";
import { addHours } from "@/lib/dates";
import { useFormat } from "@/lib/format/use-format";

echarts.use([LineChart, GridComponent, TooltipComponent]);

type DecisionHour = Schemas["DecisionHour"];

const splitStack = "split";

function difference(minuend: number | null, subtrahend: number | null) {
  return minuend === null || subtrahend === null ? null : Math.max(minuend - subtrahend, 0);
}

function stackedArea(id: string, data: (number | null)[], color: string) {
  return {
    id,
    type: "line" as const,
    stack: splitStack,
    data,
    symbol: "none",
    silent: true,
    lineStyle: { width: 0 },
    areaStyle: { color, opacity: 1 },
  };
}

type DemandChartProps = {
  hours: DecisionHour[];
  timeZone: string;
};

export function DemandChart({ hours, timeZone }: DemandChartProps) {
  const t = useTranslations("decision.demandChart");
  const format = useFormat();

  const config = useMemo(
    () => chartConfig({ forecast: t("firm"), risk: t("risk"), other: t("other"), demand: t("actualDemand") }),
    [t],
  );

  const describeHour = useCallback(
    (hour: DecisionHour) => {
      const title = t("hourRange", {
        start: format.dateTime(hour.start_time, timeZone, "hourMinute"),
        end: format.dateTime(addHours(hour.start_time, 1), timeZone, "hourMinute"),
      });
      const lines: TooltipLine[] = [
        { label: t("demandForecast"), value: format.mw(hour.demand_forecast_mw) },
        { label: t("windForecast"), value: format.mw(hour.forecast_mw), series: "risk" },
        { label: t("firm"), value: format.mw(hour.lower_mw), series: "forecast" },
        { label: t("other"), value: format.mw(hour.net_demand_forecast_mw), series: "other" },
        { label: t("otherIfLow"), value: format.mw(hour.net_demand_plan_mw) },
        { label: t("actualDemand"), value: format.mw(hour.demand_actual_mw), series: "demand" },
        { label: t("actualOther"), value: format.mw(hour.net_demand_actual_mw) },
      ];
      return tooltipHtml(title, lines);
    },
    [format, t, timeZone],
  );

  const buildOption = useCallback<OptionBuilder>(
    (colors) => ({
      grid: chartGrid(),
      tooltip: axisTooltip(colors, (index) => describeHour(hours[index])),
      xAxis: categoryAxis(
        colors,
        hours.map((hour) => format.dateTime(hour.start_time, timeZone, "hourMinute")),
      ),
      yAxis: valueAxis(colors, (value) => format.gw(value, 0)),
      series: [
        stackedArea("firm", hours.map((hour) => hour.lower_mw), seriesColor(colors, "forecast")),
        stackedArea(
          "risk",
          hours.map((hour) => difference(hour.forecast_mw, hour.lower_mw)),
          withAlpha(seriesColor(colors, "risk"), 0.55),
        ),
        stackedArea(
          "other",
          hours.map((hour) => difference(hour.demand_forecast_mw, hour.forecast_mw)),
          seriesColor(colors, "other"),
        ),
        {
          id: "actualDemand",
          type: "line",
          data: hours.map((hour) => hour.demand_actual_mw),
          symbol: "none",
          lineStyle: { color: seriesColor(colors, "demand"), width: 1.5, type: [5, 3] },
          emphasis: { disabled: true },
        },
      ],
    }),
    [describeHour, format, hours, timeZone],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("firm"), swatch: "bar", colorClass: "bg-forecast" },
          { label: t("risk"), swatch: "bar", colorClass: "bg-risk/55" },
          { label: t("other"), swatch: "bar", colorClass: "bg-other" },
          { label: t("actualDemand"), swatch: "dashed", colorClass: "border-demand" },
        ]}
      />
      <EChart config={config} buildOption={buildOption} label={t("ariaLabel")} className="h-64 w-full sm:h-72" />
    </div>
  );
}
