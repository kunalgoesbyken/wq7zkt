"use client";

import { LineChart } from "echarts/charts";
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

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent]);

type HorizonCurveChartProps = {
  points: Schemas["HorizonPoint"][];
  selectedHorizon: number | null;
};

export function HorizonCurveChart({ points, selectedHorizon }: HorizonCurveChartProps) {
  const t = useTranslations("accuracy.horizonCurve");
  const format = useFormat();
  const config = useMemo(() => chartConfig({ risk: t("mae"), long: t("bias") }), [t]);
  const selectedIndex = points.findIndex((point) => point.horizon_h === selectedHorizon);

  const buildOption = useCallback<OptionBuilder>(
    (colors) => {
      const maeColor = seriesColor(colors, "risk");
      const selectedMarker =
        selectedIndex < 0
          ? undefined
          : {
              silent: true,
              symbol: "none",
              label: { show: false },
              lineStyle: { color: withAlpha(colors.tokens.foreground, 0.55), type: "solid" as const, width: 1 },
              data: [{ xAxis: selectedIndex }],
            };

      return {
        grid: chartGrid({ bottom: 20 }),
        tooltip: axisTooltip(colors, (index) => {
          const point = points[index];
          return tooltipHtml(format.leadTime(point.horizon_h), [
            { label: t("mae"), value: format.mw(point.mae_mw), series: "risk" },
            { label: t("bias"), value: format.signedMw(point.bias_mw), series: "long" },
            { label: t("rmse"), value: format.mw(point.rmse_mw) },
            { label: t("p90"), value: format.mw(point.p90_abs_error_mw) },
            { label: t("hours"), value: format.count(point.n) },
          ]);
        }),
        xAxis: {
          ...categoryAxis(
            colors,
            points.map((point) => format.count(point.horizon_h)),
          ),
          name: t("axis"),
          nameLocation: "middle",
          nameGap: 30,
          nameTextStyle: { color: colors.tokens.mutedForeground, fontSize: 11 },
        },
        yAxis: valueAxis(colors, (value) => format.gw(value, 1)),
        series: [
          {
            id: "mae",
            type: "line",
            data: points.map((point) => point.mae_mw),
            symbol: "circle",
            symbolSize: (_value: unknown, params: { dataIndex: number }) => (params.dataIndex === selectedIndex ? 9 : 0),
            itemStyle: { color: maeColor, borderColor: colors.tokens.background, borderWidth: 2 },
            lineStyle: { color: maeColor, width: 2.25 },
            markLine: selectedMarker,
          },
          {
            id: "bias",
            type: "line",
            data: points.map((point) => point.bias_mw),
            symbol: "none",
            lineStyle: { color: seriesColor(colors, "long"), width: 1.75, type: [5, 4] },
            markLine: zeroLine(colors),
          },
        ],
      };
    },
    [format, points, selectedIndex, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: t("mae"), swatch: "line", colorClass: "bg-risk" },
          { label: t("bias"), swatch: "dashed", colorClass: "border-long" },
          ...(selectedIndex < 0 ? [] : [{ label: t("selected"), swatch: "line" as const, colorClass: "h-3 w-px bg-foreground" }]),
        ]}
      />
      <EChart config={config} buildOption={buildOption} label={t("ariaLabel")} className="h-64 w-full lg:h-72" />
    </div>
  );
}
