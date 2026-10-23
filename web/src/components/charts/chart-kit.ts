import { flattenColor, withAlpha, type ChartConfig, type ResolvedColors } from "@/components/evilcharts/ui/echarts-chart";
import {
  tooltipBaseOption,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
} from "@/components/evilcharts/ui/echarts-tooltip";

const seriesTokens = {
  forecast: "var(--forecast)",
  actual: "var(--actual)",
  risk: "var(--risk)",
  long: "var(--long)",
  demand: "var(--demand)",
  other: "var(--other)",
} as const;

export type SeriesKey = keyof typeof seriesTokens;

export function chartConfig(labels: Partial<Record<SeriesKey, string>>): ChartConfig {
  return Object.fromEntries(
    Object.entries(labels).map(([key, label]) => [key, { label, colors: { light: [seriesTokens[key as SeriesKey]] } }]),
  );
}

export function seriesColor(colors: ResolvedColors, key: SeriesKey): string {
  return colors.series[key]?.[0] ?? colors.tokens.foreground;
}

const bandOpacity = 0.16;

export function bandColor(colors: ResolvedColors): string {
  return withAlpha(seriesColor(colors, "forecast"), bandOpacity);
}

const axisFontSize = 11;

function axisText(colors: ResolvedColors) {
  return { color: colors.tokens.mutedForeground, fontSize: axisFontSize, fontFamily: "inherit" };
}

function tickDots(colors: ResolvedColors) {
  return {
    show: true,
    length: 0.5,
    lineStyle: { color: flattenColor(colors.tokens.border, colors.tokens.background), width: 3, cap: "round" as const },
  };
}

type CategoryAxisOptions = {
  boundaryGap?: boolean;
  labelInterval?: (index: number) => boolean;
};

export function categoryAxis(colors: ResolvedColors, data: string[], options: CategoryAxisOptions = {}) {
  return {
    type: "category" as const,
    data,
    boundaryGap: options.boundaryGap ?? false,
    axisLine: { show: false },
    axisTick: { ...tickDots(colors), alignWithLabel: true },
    axisLabel: { ...axisText(colors), margin: 10, hideOverlap: true, interval: options.labelInterval ?? "auto" },
    splitLine: { show: false },
  };
}

export function valueAxis(colors: ResolvedColors, formatter: (value: number) => string) {
  return {
    type: "value" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...axisText(colors), margin: 10, formatter },
    splitLine: { lineStyle: { color: colors.tokens.border, type: [3, 3] as [number, number], width: 1 } },
  };
}

export function chartGrid(overrides: Record<string, number> = {}) {
  return { left: 4, right: 12, top: 16, bottom: 4, outerBoundsMode: "same", outerBoundsContain: "axisLabel", ...overrides };
}

export function zeroLine(colors: ResolvedColors) {
  return {
    silent: true,
    symbol: "none",
    label: { show: false },
    lineStyle: { color: withAlpha(colors.tokens.mutedForeground, 0.7), type: "solid" as const, width: 1 },
    data: [{ yAxis: 0 }],
  };
}

export function axisTooltip(colors: ResolvedColors, formatter: (dataIndex: number) => string) {
  return {
    ...tooltipBaseOption({
      present: true,
      cursor: true,
      tokens: colors.tokens,
      position: "variable",
      axisPointerColor: colors.tokens.border,
      strokeWidth: 1,
    }),
    formatter: (params: unknown) => {
      const [first] = Array.isArray(params) ? params : [params];
      const dataIndex = (first as { dataIndex?: number } | undefined)?.dataIndex;
      return dataIndex === undefined ? "" : formatter(dataIndex);
    },
  };
}

export type TooltipLine = { label: string; value: string; series?: SeriesKey };

const indicatorSpacer = `<div class="h-2.5 w-2.5 shrink-0"></div>`;

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function tooltipHtml(title: string, lines: TooltipLine[], footnote?: string): string {
  const body = lines
    .map(({ label, value, series }) =>
      tooltipRow({
        indicatorHtml: series ? tooltipIndicatorHtml(series, 1) : indicatorSpacer,
        labelText: escapeHtml(label),
        valueText: escapeHtml(value),
        dimmed: "",
      }),
    )
    .join("");
  const note = footnote ? `<div class="max-w-56 pt-1 text-muted-foreground leading-snug">${escapeHtml(footnote)}</div>` : "";
  return tooltipShell({ label: escapeHtml(title), body: body + note, roundness: "lg", variant: "frosted-glass" });
}
