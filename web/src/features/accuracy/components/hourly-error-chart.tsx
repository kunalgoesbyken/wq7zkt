"use client";

import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
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
  zeroLine,
} from "@/components/charts/chart-kit";
import { EChart, type OptionBuilder } from "@/components/charts/echart";
import { withAlpha } from "@/components/evilcharts/ui/echarts-chart";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent]);

const barOpacity = 0.5;

export function HourlyErrorChart({ hours }: { hours: Schemas["HourOfDayStat"][] }) {
  const t = useTranslations("accuracy.byHour");
  const format = useFormat();
  const config = useMemo(() => chartConfig({ risk: t("mae"), long: t("bias") }), [t]);

  const buildOption = useCallback<OptionBuilder>(
    (colors) => ({
      grid: chartGrid(),
      tooltip: {
        ...axisTooltip(colors, (index) => {
          const stat = hours[index];
          return tooltipHtml(format.clockHour(stat.hour), [
            { label: t("mae"), value: format.mw(stat.mae_mw), series: "risk" },
            { label: t("bias"), value: format.signedMw(stat.bias_mw), series: "long" },
            { label: t("hours"), value: format.count(stat.n) },
          ]);
        }),
        axisPointer: { type: "shadow", shadowStyle: { color: colors.tokens.border } },
      },
      xAxis: categoryAxis(
        colors,
        hours.map((stat) => format.clockHour(stat.hour)),
        { boundaryGap: true },
      ),
      yAxis: valueAxis(colors, (value) => format.gw(value, 1)),
      series: [
        {
          id: "mae",
          type: "bar",
          barCategoryGap: "28%",
          data: hours.map((stat) => stat.mae_mw),
          itemStyle: { color: withAlpha(seriesColor(colors, "risk"), barOpacity), borderRadius: [3, 3, 0, 0] },
        },
        {
          id: "bias",
          type: "line",
          data: hours.map((stat) => stat.bias_mw),
          symbol: "circle",
          symbolSize: 5,
          itemStyle: { color: seriesColor(colors, "long") },
          lineStyle: { color: seriesColor(colors, "long"), width: 1.75 },
          markLine: zeroLine(colors),
        },
      ],
    }),
    [format, hours, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("mae"), swatch: "bar", colorClass: "bg-risk" },
          { label: t("bias"), swatch: "line", colorClass: "bg-long" },
        ]}
      />
      <EChart config={config} buildOption={buildOption} label={t("ariaLabel")} className="h-64 w-full lg:h-72" />
    </div>
  );
}
