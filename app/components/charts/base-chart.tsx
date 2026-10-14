/**
 * BaseChart
 *
 * Thin wrapper around echarts-for-react that uses the BlueCopa ECharts theme,
 * handles responsive resizing, and provides loading & empty states.
 */

import React, { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption, ECharts } from "echarts";
import { useChartContext } from "./chart-provider";
import { chartAnimation } from "./chart-utils";
import { cn } from "~/utils/utils";

export interface BaseChartProps {
  option: EChartsOption | Record<string, any>;
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  onEvents?: Record<string, (params: any) => void>;
  group?: string;
  noAnimation?: boolean;
  renderer?: "canvas" | "svg";
  onChartReady?: (instance: ECharts) => void;
  ariaLabel?: string;
  dataSummary?: string;
}

export interface BaseChartRef {
  getInstance: () => ECharts | undefined;
  resize: () => void;
}

function ChartLoading() {
  return (
    <div className="copa:absolute copa:inset-0 copa:flex copa:items-center copa:justify-center copa:bg-background/60 copa:backdrop-blur-sm copa:z-10 copa:rounded-lg">
      <div className="copa:flex copa:flex-col copa:items-center copa:gap-3">
        <div className="copa:h-8 copa:w-8 copa:rounded-full copa:border-2 copa:border-muted copa:border-t-primary copa:animate-spin" />
        <span className="copa:text-xs copa:text-muted-foreground">Loading chart…</span>
      </div>
    </div>
  );
}

function ChartEmpty({ text = "No data available" }: { text?: string }) {
  return (
    <div className="copa:absolute copa:inset-0 copa:flex copa:items-center copa:justify-center copa:z-10">
      <div className="copa:flex copa:flex-col copa:items-center copa:gap-2 copa:text-muted-foreground">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="copa:opacity-40">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 4-6" />
        </svg>
        <span className="copa:text-sm">{text}</span>
      </div>
    </div>
  );
}

export const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  function BaseChart(
    {
      option,
      height = "100%",
      width = "100%",
      className,
      style,
      loading = false,
      empty = false,
      emptyText,
      onEvents,
      group,
      noAnimation = false,
      renderer = "canvas",
      onChartReady,
      ariaLabel,
      dataSummary,
    },
    ref
  ) {
    const chartRef = useRef<ReactECharts>(null);
    const { themeName, version } = useChartContext();

    const mergedOption = useMemo(() => {
      const anim = noAnimation ? { animation: false } : chartAnimation();
      return { ...anim, ...option };
    }, [option, noAnimation]);

    useImperativeHandle(ref, () => ({
      getInstance: () => chartRef.current?.getEchartsInstance(),
      resize: () => chartRef.current?.getEchartsInstance()?.resize(),
    }));

    useEffect(() => {
      if (group) {
        const instance = chartRef.current?.getEchartsInstance();
        if (instance) instance.group = group;
      }
    }, [group]);

    useEffect(() => {
      if (onChartReady) {
        const instance = chartRef.current?.getEchartsInstance();
        if (instance) onChartReady(instance);
      }
    }, [onChartReady]);

    const key = `chart-${version}`;

    return (
      <div
        className={cn("copa:relative", className)}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          width: typeof width === "number" ? `${width}px` : width,
          minHeight: 200,
          ...style,
        }}
        role="img"
        aria-label={ariaLabel}
      >
        {dataSummary && (
          <div className="copa:sr-only" role="document" aria-label="Chart data">
            {dataSummary}
          </div>
        )}
        {loading && <ChartLoading />}
        {empty && <ChartEmpty text={emptyText} />}

        <ReactECharts
          key={key}
          ref={chartRef}
          option={mergedOption}
          theme={themeName}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer }}
          onEvents={onEvents}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    );
  }
);

export default BaseChart;
