/**
 * Chart Theme Bridge
 * Reads CSS design tokens from .mfe-root and maps them to ECharts theme.
 */

import * as echarts from "echarts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a CSS custom property — prefers .mfe-root, falls back to :root */
function getCSSVar(name: string): string {
  const mfeRoot = document.querySelector(".mfe-root") as HTMLElement | null;
  const target = mfeRoot ?? document.documentElement;
  return getComputedStyle(target).getPropertyValue(name).trim();
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const [lr, lg, lb] = oklabToLinearSrgb(L, a, b);
  const r = Math.round(clamp01(linearToSrgb(lr)) * 255);
  const g = Math.round(clamp01(linearToSrgb(lg)) * 255);
  const bv = Math.round(clamp01(linearToSrgb(lb)) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bv.toString(16).padStart(2, "0")}`;
}

function parseRgbToHex(str: string): string | null {
  const m = str.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (!m) return null;
  const r = Math.round(parseFloat(m[1]));
  const g = Math.round(parseFloat(m[2]));
  const b = Math.round(parseFloat(m[3]));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function resolveColor(cssValue: string): string {
  if (!cssValue) return "#888888";
  const v = cssValue.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, r, g, b] = v.split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const oklchMatch = v.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (oklchMatch) {
    return oklchToHex(parseFloat(oklchMatch[1]), parseFloat(oklchMatch[2]), parseFloat(oklchMatch[3]));
  }

  const rgbResult = parseRgbToHex(v);
  if (rgbResult) return rgbResult;

  return "#888888";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

function tint(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

// ---------------------------------------------------------------------------
// Fallback colors (hex equivalents of Dream Light OKLCH chart palette)
// ---------------------------------------------------------------------------

const CHART_FALLBACK_COLORS = [
  "#2563eb", // --chart-1: oklch(0.55 0.15 255) — Blue
  "#0d9488", // --chart-2: oklch(0.62 0.12 175) — Teal
  "#ca8a04", // --chart-3: oklch(0.70 0.13 80)  — Gold
  "#7c3aed", // --chart-4: oklch(0.55 0.14 295) — Purple
  "#dc2626", // --chart-5: oklch(0.62 0.12 15)  — Red
];

function resolveChartColor(cssVar: string, fallback: string): string {
  const raw = getCSSVar(cssVar);
  if (!raw) return fallback;
  const resolved = resolveColor(raw);
  return resolved === "#888888" ? fallback : resolved;
}

// ---------------------------------------------------------------------------
// Token Resolution
// ---------------------------------------------------------------------------

export interface ChartTokens {
  colors: string[];
  fontFamily: string;
  fontSize: number;
  textColor: string;
  textColorSecondary: string;
  backgroundColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  containerPadding: number;
  animationDuration: number;
  animationEasing: string;
}

export function resolveChartTokens(): ChartTokens {
  const base5 = [
    resolveChartColor("--chart-1", CHART_FALLBACK_COLORS[0]),
    resolveChartColor("--chart-2", CHART_FALLBACK_COLORS[1]),
    resolveChartColor("--chart-3", CHART_FALLBACK_COLORS[2]),
    resolveChartColor("--chart-4", CHART_FALLBACK_COLORS[3]),
    resolveChartColor("--chart-5", CHART_FALLBACK_COLORS[4]),
  ];

  const extended = [
    ...base5,
    tint(base5[0], 0.35),
    shade(base5[1], 0.25),
    tint(base5[2], 0.4),
    shade(base5[3], 0.2),
    tint(base5[4], 0.3),
  ];

  const fontFamily = getCSSVar("--font-sans") || "Satoshi, system-ui, sans-serif";

  return {
    colors: extended,
    fontFamily,
    fontSize: 12,
    textColor: resolveChartColor("--foreground", "#1a1a1a"),
    textColorSecondary: resolveChartColor("--muted-foreground", "#737373"),
    backgroundColor: resolveChartColor("--background", "#f8f8fa"),
    borderColor: resolveChartColor("--border", "#e5e5e5"),
    successColor: resolveChartColor("--status-success", "#22c55e"),
    warningColor: resolveChartColor("--status-warning", "#f59e0b"),
    errorColor: resolveChartColor("--status-error", "#ef4444"),
    infoColor: resolveChartColor("--status-info", "#3b82f6"),
    containerPadding: 16,
    animationDuration: 800,
    animationEasing: "cubicInOut",
  };
}

// ---------------------------------------------------------------------------
// ECharts Theme
// ---------------------------------------------------------------------------

export function buildEChartsTheme(tokens: ChartTokens): Record<string, any> {
  const { colors, fontFamily, fontSize, textColor, textColorSecondary, backgroundColor, borderColor } = tokens;

  return {
    color: colors,
    backgroundColor: "transparent",
    textStyle: { fontFamily, fontSize, color: textColor },
    title: {
      textStyle: { fontFamily, fontSize: 16, fontWeight: 600, color: textColor },
      subtextStyle: { fontFamily, fontSize: 12, color: textColorSecondary },
      top: 0, left: 0, padding: [0, 0, 16, 0],
    },
    legend: {
      textStyle: { fontFamily, fontSize: 12, color: textColorSecondary },
      icon: "roundRect", itemWidth: 12, itemHeight: 12, itemGap: 16, bottom: 0,
    },
    tooltip: {
      backgroundColor, borderColor, borderWidth: 1, borderRadius: 8, padding: [8, 12],
      textStyle: { fontFamily, fontSize: 12, color: textColor },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.08); backdrop-filter: blur(8px);",
    },
    grid: { top: 48, right: 16, bottom: 48, left: 16, containLabel: true },
    categoryAxis: {
      axisLine: { show: true, lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: { fontFamily, fontSize: 11, color: textColorSecondary },
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { fontFamily, fontSize: 11, color: textColorSecondary },
      splitLine: { show: true, lineStyle: { color: borderColor, type: "dashed", opacity: 0.6 } },
    },
    bar: {
      barMaxWidth: 32,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      emphasis: {
        focus: "series", blurScope: "coordinateSystem",
        itemStyle: { shadowBlur: 12, shadowOffsetY: 3, shadowColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
      },
    },
    line: {
      smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 2.5 },
      emphasis: {
        focus: "series", blurScope: "coordinateSystem", lineStyle: { width: 4 },
        itemStyle: { borderWidth: 3, borderColor: "#fff", shadowBlur: 8, shadowColor: "rgba(0,0,0,0.18)" },
      },
    },
    pie: {
      radius: ["0%", "70%"],
      itemStyle: { borderColor: backgroundColor, borderWidth: 3, borderRadius: 4 },
      label: { fontFamily, fontSize: 12, color: textColor },
      emphasis: {
        focus: "self",
        itemStyle: { shadowBlur: 16, shadowOffsetY: 4, shadowColor: "rgba(0,0,0,0.25)", borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Theme Registration
// ---------------------------------------------------------------------------

const THEME_NAME = "bluecopa";
let _registered = false;

export function registerChartTheme(): string {
  const tokens = resolveChartTokens();
  const theme = buildEChartsTheme(tokens);
  echarts.registerTheme(THEME_NAME, theme);
  _registered = true;
  return THEME_NAME;
}

export function isChartThemeRegistered(): boolean {
  return _registered;
}

export const CHART_THEME_NAME = THEME_NAME;
