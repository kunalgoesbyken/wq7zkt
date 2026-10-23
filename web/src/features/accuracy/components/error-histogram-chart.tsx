"use client";

import { BarChart } from "echarts/charts";
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
import { withAlpha } from "@/components/evilcharts/ui/echarts-chart";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";

echarts.use([BarChart, GridComponent, TooltipComponent]);

type HistogramBin = Schemas["HistogramBin"];

const barOpacity = 0.75;

function isOverForecast(bin: HistogramBin) {
  return bin.lower_mw >= 0;
}

export function ErrorHistogramChart({ bins }: { bins: HistogramBin[] }) {
  const t = useTranslations("accuracy.histogram");
  const format = useFormat();
  const config = useMemo(() => chartConfig({ risk: t("over"), long: t("under") }), [t]);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);

  const buildOption = useCallback<OptionBuilder>(
    (colors) => {
      const over = withAlpha(seriesColor(colors, "risk"), barOpacity);
      const under = withAlpha(seriesColor(colors, "long"), barOpacity);
      return {
        grid: chartGrid(),
        tooltip: {
          ...axisTooltip(colors, (index) => {
            const bin = bins[index];
            return tooltipHtml(t("range", { lower: format.mw(bin.lower_mw), upper: format.mw(bin.upper_mw) }), [
              { label: t("hours"), value: format.count(bin.count), series: isOverForecast(bin) ? "risk" : "long" },
              { label: t("share"), value: format.ratio(total ? bin.count / total : null) },
            ]);
          }),
          axisPointer: { type: "shadow", shadowStyle: { color: colors.tokens.border } },
        },
        xAxis: categoryAxis(
          colors,
          bins.map((bin) => format.gw(bin.lower_mw, 1)),
          { boundaryGap: true },
        ),
        yAxis: valueAxis(colors, (value) => format.count(value)),
        series: [
          {
            id: "count",
            type: "bar",
            barCategoryGap: "12%",
            data: bins.map((bin) => ({
              value: bin.count,
              itemStyle: { color: isOverForecast(bin) ? over : under, borderRadius: [3, 3, 0, 0] },
            })),
          },
        ],
      };
    },
    [bins, format, t, total],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("under"), swatch: "bar", colorClass: "bg-long" },
          { label: t("over"), swatch: "bar", colorClass: "bg-risk" },
        ]}
      />
      <EChart config={config} buildOption={buildOption} label={t("ariaLabel")} className="h-64 w-full lg:h-72" />
    </div>
  );
}
