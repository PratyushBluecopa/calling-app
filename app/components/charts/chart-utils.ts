/**
 * Composable Chart Option Builders
 *
 * Each function returns a partial ECharts option that can be spread
 * into the final chart configuration.
 */

import type { EChartsOption } from "echarts";
import { resolveChartTokens } from "./chart-theme";

function tokens() {
  return resolveChartTokens();
}

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

function merge<T extends Record<string, any>>(base: T, overrides?: DeepPartial<T>): T {
  if (!overrides) return base;
  const result = { ...base };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key];
    if (val && typeof val === "object" && !Array.isArray(val) && typeof base[key] === "object") {
      result[key] = merge(base[key] as any, val as any);
    } else if (val !== undefined) {
      result[key] = val as any;
    }
  }
  return result;
}

// Tooltip
export function chartTooltip(overrides?: Record<string, any>): Pick<EChartsOption, "tooltip"> {
  const t = tokens();
  const base = {
    trigger: "axis" as const,
    confine: true,
    backgroundColor: t.backgroundColor,
    borderColor: t.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: [10, 14],
    textStyle: { fontFamily: t.fontFamily, fontSize: 12, color: t.textColor },
    extraCssText: "box-shadow: 0 4px 16px rgba(0,0,0,0.1); backdrop-filter: blur(8px);",
    axisPointer: { type: "shadow" as const, shadowStyle: { color: "rgba(0,0,0,0.04)" } },
  };
  return { tooltip: merge(base, overrides as any) };
}

// Legend
export function chartLegend(overrides?: Record<string, any>): Pick<EChartsOption, "legend"> {
  const t = tokens();
  const pos = overrides?.position ?? "bottom";
  const positionMap: Record<string, any> = {
    top: { top: 0, left: "center" },
    bottom: { bottom: 0, left: "center" },
    left: { left: 0, top: "middle", orient: "vertical" },
    right: { right: 0, top: "middle", orient: "vertical" },
  };
  const base = {
    show: true, icon: "roundRect", itemWidth: 12, itemHeight: 12, itemGap: 16,
    textStyle: { fontFamily: t.fontFamily, fontSize: 12, color: t.textColorSecondary },
    ...positionMap[pos],
  };
  const { position, ...rest } = overrides ?? {};
  return { legend: merge(base, rest) };
}

// Category Axis
export function chartCategoryAxis(data?: string[], overrides?: Record<string, any>): any {
  const t = tokens();
  const base: any = {
    type: "category", data,
    axisLine: { show: true, lineStyle: { color: t.borderColor } },
    axisTick: { show: false },
    axisLabel: { fontFamily: t.fontFamily, fontSize: 11, color: t.textColorSecondary, rotate: overrides?.rotate ?? 0 },
    splitLine: { show: false },
  };
  return merge(base, overrides);
}

// Value Axis
export function chartValueAxis(overrides?: Record<string, any>): any {
  const t = tokens();
  const base: any = {
    type: "value",
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { fontFamily: t.fontFamily, fontSize: 11, color: t.textColorSecondary },
    splitLine: { show: true, lineStyle: { color: t.borderColor, type: "dashed", opacity: 0.6 } },
  };
  return merge(base, overrides);
}

// Title
export function chartTitle(text: string, overrides?: { subtitle?: string; left?: string | number }): Pick<EChartsOption, "title"> {
  const t = tokens();
  const base = {
    text, subtext: overrides?.subtitle ?? "", left: overrides?.left ?? 0, top: 0, padding: [0, 0, 8, 0],
    textStyle: { fontFamily: t.fontFamily, fontSize: 16, fontWeight: 600 as const, color: t.textColor },
    subtextStyle: { fontFamily: t.fontFamily, fontSize: 12, color: t.textColorSecondary },
  };
  return { title: base };
}

// Grid
export function chartGrid(overrides?: Record<string, any>): Pick<EChartsOption, "grid"> {
  const base = { top: 48, right: 16, bottom: 48, left: 16, containLabel: true };
  return { grid: merge(base, overrides as any) };
}

// Animation
export function chartAnimation(overrides?: Record<string, any>): Record<string, any> {
  return {
    animation: true,
    animationDuration: overrides?.duration ?? 800,
    animationEasing: overrides?.easing ?? "cubicInOut",
    animationDelay: overrides?.delay ?? ((idx: number) => idx * 60),
    animationDurationUpdate: 400,
    animationEasingUpdate: "cubicInOut",
  };
}

// Colors
export function chartColors(): string[] {
  return tokens().colors;
}

export function chartColor(index: number): string {
  const colors = chartColors();
  return colors[index % colors.length];
}

// Formatters
export function formatChartValue(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(decimals) + "B";
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(decimals) + "M";
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(decimals) + "K";
  return value.toFixed(decimals);
}

export function formatChartCurrency(value: number, currency = "USD", decimals = 0): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}
