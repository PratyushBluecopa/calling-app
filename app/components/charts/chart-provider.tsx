/**
 * ChartProvider
 *
 * React context that bridges the CSS design token system to ECharts.
 * Re-registers the ECharts theme when the document theme changes.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { registerChartTheme, resolveChartTokens, CHART_THEME_NAME, type ChartTokens } from "./chart-theme";

interface ChartContextValue {
  themeName: string;
  tokens: ChartTokens;
  version: number;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function useChartContext(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error("useChartContext must be used inside a <ChartProvider>.");
  }
  return ctx;
}

interface ChartProviderProps {
  children: React.ReactNode;
}

export function ChartProvider({ children }: ChartProviderProps) {
  const [version, setVersion] = useState(0);
  const [chartTokens, setChartTokens] = useState<ChartTokens>(() =>
    typeof window !== "undefined" ? resolveChartTokens() : ({} as ChartTokens)
  );
  const observerRef = useRef<MutationObserver | null>(null);

  const refresh = useCallback(() => {
    registerChartTheme();
    setChartTokens(resolveChartTokens());
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    refresh();

    const target = document.documentElement;
    observerRef.current = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && (m.attributeName === "class" || m.attributeName === "data-theme" || m.attributeName === "style")) {
          refresh();
          break;
        }
      }
    });

    observerRef.current.observe(target, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [refresh]);

  return (
    <ChartContext.Provider value={{ themeName: CHART_THEME_NAME, tokens: chartTokens, version }}>
      {children}
    </ChartContext.Provider>
  );
}

export default ChartProvider;
