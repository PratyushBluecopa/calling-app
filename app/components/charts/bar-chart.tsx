import React, { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { BaseChart, type BaseChartRef } from "./base-chart";
import { chartTooltip, chartLegend, chartGrid, chartCategoryAxis, chartValueAxis, chartTitle, chartAnimation, chartColor } from "./chart-utils";
import { cn } from "~/utils/utils";

export interface BarChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface BarChartData {
  categories: string[];
  series: BarChartSeries[];
}

export interface BarChartProps {
  data: BarChartData;
  title?: string;
  subtitle?: string;
  height?: string | number;
  className?: string;
  horizontal?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  onBarClick?: (params: { name: string; seriesName: string; value: number }) => void;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}

export const BarChart = React.forwardRef<BaseChartRef, BarChartProps>(
  function BarChart(
    { data, title, subtitle, height = "100%", className, horizontal = false, stacked = false, showLegend, showValues = false, loading = false, empty = false, emptyText, onBarClick, formatValue, ariaLabel },
    ref
  ) {
    const option = useMemo<EChartsOption>(() => {
      const { categories, series } = data;
      const shouldShowLegend = showLegend ?? series.length > 1;

      const chartSeries = series.map((s, idx) => ({
        type: "bar" as const,
        name: s.name,
        data: s.data,
        itemStyle: {
          color: s.color ?? chartColor(idx),
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        emphasis: {
          focus: "series" as const,
          blurScope: "coordinateSystem" as const,
          itemStyle: { shadowBlur: 10, shadowOffsetY: 2, shadowColor: "rgba(0, 0, 0, 0.18)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.4)" },
        },
        stack: stacked ? "value" : undefined,
        label: showValues
          ? { show: true, position: (horizontal ? "right" : "top") as any, formatter: formatValue ? (p: any) => formatValue(p.value) : undefined, fontSize: 11, fontWeight: 500, distance: 4 }
          : undefined,
      }));

      const baseOption: Record<string, any> = {
        ...(title && chartTitle(title, { subtitle })),
        ...chartTooltip({
          trigger: "axis",
          formatter: (params: any) => {
            if (!Array.isArray(params)) params = [params];
            let html = `<strong>${params[0]?.name}</strong><br/>`;
            params.forEach((p: any) => {
              const val = formatValue ? formatValue(p.value) : p.value;
              html += `<span style="display:inline-block;margin-right:8px;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:6px;"></span>${p.seriesName}: ${val}</span><br/>`;
            });
            return html;
          },
        }),
        ...(shouldShowLegend && chartLegend({ position: "bottom" })),
        ...chartGrid(),
        ...chartAnimation({ delay: (idx: number) => idx * 60 }),
      };

      if (horizontal) {
        baseOption.xAxis = chartValueAxis();
        baseOption.yAxis = chartCategoryAxis(categories);
      } else {
        baseOption.xAxis = chartCategoryAxis(categories);
        baseOption.yAxis = chartValueAxis();
      }

      baseOption.series = chartSeries;
      return baseOption;
    }, [data, title, subtitle, horizontal, stacked, showLegend, showValues, formatValue]);

    const onEvents = useMemo(() => {
      if (!onBarClick) return undefined;
      return {
        click: (params: any) => {
          if (params.componentSubType === "bar") {
            onBarClick({ name: params.name, seriesName: params.seriesName, value: params.value });
          }
        },
      };
    }, [onBarClick]);

    const dataSummary = useMemo(() => {
      const { categories, series } = data;
      return series.map((s) => {
        const points = s.data.map((val, i) => `${categories[i]}: ${formatValue ? formatValue(val) : val}`).join(", ");
        return `${s.name}: ${points}`;
      }).join(". ");
    }, [data, formatValue]);

    return (
      <BaseChart
        ref={ref}
        option={option}
        height={height}
        className={cn("copa:bar-chart", className)}
        loading={loading}
        empty={empty}
        emptyText={emptyText}
        onEvents={onEvents}
        ariaLabel={ariaLabel || `Bar chart${title ? `: ${title}` : ""}`}
        dataSummary={dataSummary}
      />
    );
  }
);

BarChart.displayName = "BarChart";
export default BarChart;
