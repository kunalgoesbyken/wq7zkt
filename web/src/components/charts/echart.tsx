"use client";

import * as echarts from "echarts/core";
import { useEffect, useId, useMemo, useRef } from "react";
import {
  buildChartCss,
  resolveColors,
  type ChartConfig,
  type ResolvedColors,
} from "@/components/evilcharts/ui/echarts-chart";
import { cn } from "@/lib/utils";

export type OptionBuilder = (colors: ResolvedColors) => echarts.EChartsCoreOption;

type EChartProps = {
  config: ChartConfig;
  buildOption: OptionBuilder;
  label: string;
  className?: string;
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function EChart({ config, buildOption, label, className }: EChartProps) {
  const chartId = useId();
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const chart = echarts.init(mount, null, { renderer: "canvas" });
    chartRef.current = chart;
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(mount);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    const render = () => {
      const option = buildOption(resolveColors(container, config, Object.keys(config)));
      const animation = !window.matchMedia(reducedMotionQuery).matches;
      chart.setOption({ ...option, animation, animationDuration: 450 }, { notMerge: true });
    };
    render();

    const themeObserver = new MutationObserver(render);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => themeObserver.disconnect();
  }, [buildOption, config]);

  return (
    <div ref={containerRef} data-chart={chartId} role="img" aria-label={label} className={cn("relative text-xs", className)}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div ref={mountRef} className="size-full" />
    </div>
  );
}
