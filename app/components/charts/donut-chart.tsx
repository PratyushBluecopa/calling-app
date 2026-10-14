import React, { useMemo } from "react";
import { BaseChart } from "./base-chart";
import { chartTooltip, chartLegend, chartAnimation, chartColors } from "./chart-utils";
import { resolveChartTokens } from "./chart-theme";

export interface DonutChartData {
  items: { name: string; value: number; color?: string }[];
}

export interface DonutChartProps {
  data: DonutChartData;
  title?: string;
  subtitle?: string;
  height?: string | number;
  className?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  centerText?: string;
  centerSubText?: string;
  thickness?: number;
  loading?: boolean;
  empty?: boolean;
  onSliceClick?: (params: any) => void;
  ariaLabel?: string;
}

export function DonutChart({
  data, title, subtitle, height = 300, className, showLegend = true, showLabels = false,
  centerText, centerSubText, thickness = 60, loading = false, empty = false, onSliceClick, ariaLabel,
}: DonutChartProps) {
  const option = useMemo(() => {
    const colors = chartColors();
    const tokens = resolveChartTokens();
    const innerRadius = `${Math.max(100 - thickness, 20)}%`;
    const outerRadius = "70%";

    const graphic: any[] = [];
    if (centerText) {
      graphic.push({
        type: "text", left: "center", top: "42%",
        style: { text: centerText, fontSize: 24, fontWeight: 700, fontFamily: tokens.fontFamily, fill: tokens.textColor, textAlign: "center" },
      });
    }
    if (centerSubText) {
      graphic.push({
        type: "text", left: "center", top: "54%",
        style: { text: centerSubText, fontSize: 12, fontFamily: tokens.fontFamily, fill: tokens.textColorSecondary, textAlign: "center" },
      });
    }

    return {
      ...(title ? {
        title: {
          text: title, subtext: subtitle || "", left: 0, top: 0,
          textStyle: { fontSize: 16, fontWeight: 600, fontFamily: tokens.fontFamily, color: tokens.textColor },
          subtextStyle: { fontSize: 12, fontFamily: tokens.fontFamily, color: tokens.textColorSecondary },
        },
      } : {}),
      ...chartTooltip({ trigger: "item" }),
      ...(showLegend ? chartLegend({ position: "bottom" }) : {}),
      ...chartAnimation(),
      graphic,
      series: [{
        type: "pie" as const,
        radius: [innerRadius, outerRadius],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderColor: tokens.backgroundColor, borderWidth: 2, borderRadius: 4 },
        label: { show: showLabels, formatter: "{b}: {d}%", fontSize: 12, fontFamily: tokens.fontFamily },
        labelLine: { show: showLabels },
        emphasis: {
          focus: "self",
          scale: false, scaleSize: 0,
          itemStyle: { shadowBlur: 16, shadowOffsetY: 4, shadowColor: "rgba(0,0,0,0.25)", borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" },
        },
        data: data.items.map((item, i) => ({
          name: item.name, value: item.value,
          itemStyle: item.color ? { color: item.color } : { color: colors[i % colors.length] },
        })),
        animationType: "expansion",
        animationEasing: "cubicInOut",
        animationDelay: (idx: number) => idx * 60,
      }],
    };
  }, [data, title, subtitle, showLegend, showLabels, centerText, centerSubText, thickness]);

  const dataSummary = useMemo(() => {
    const total = data.items.reduce((sum, item) => sum + item.value, 0);
    return data.items.map((item) => {
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
      return `${item.name}: ${item.value.toLocaleString()} (${pct}%)`;
    }).join(", ");
  }, [data]);

  return (
    <BaseChart
      option={option}
      height={height}
      className={className}
      loading={loading}
      empty={empty || data.items.length === 0}
      onEvents={onSliceClick ? { click: onSliceClick } : undefined}
      ariaLabel={ariaLabel || `Donut chart${title ? `: ${title}` : ""}`}
      dataSummary={dataSummary}
    />
  );
}

export default DonutChart;
