"use client";

import { useMemo, useState } from "react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import type { DashboardMetrics } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

const periods = ["Week", "Month", "6 months", "Year"] as const;

export function AnalyticsSection({
  analytics,
}: {
  analytics: DashboardMetrics["analytics"] | null;
}) {
  const [period, setPeriod] = useState<(typeof periods)[number]>("6 months");
  const { currency } = useCurrency();

  const chartData = useMemo(() => {
    if (!analytics?.monthlyIncome.length) {
      return [];
    }
    if (period === "6 months" || period === "Year") {
      return analytics.monthlyIncome;
    }
    if (period === "Month") {
      const last = analytics.monthlyIncome.at(-1);
      return last ? [last] : [];
    }
    const lastTwo = analytics.monthlyIncome.slice(-2);
    return lastTwo.length ? lastTwo : analytics.monthlyIncome;
  }, [analytics, period]);

  const displayIncome = useMemo(() => {
    if (!analytics) {
      return null;
    }
    if (period === "Month" || period === "Week") {
      const last = analytics.monthlyIncome.at(-1);
      return last?.incomePaise ?? analytics.periodIncomePaise;
    }
    return analytics.monthlyIncome.reduce(
      (sum, m) => sum + m.incomePaise,
      0,
    );
  }, [analytics, period]);

  const max = Math.max(...chartData.map((d) => d.incomePaise), 1);
  const highlightIndex = chartData.length - 1;

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-950">Analytics</h2>
        <div className="flex flex-wrap gap-1 rounded-full bg-zinc-100 p-1">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                period === p
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-500">Confirmed income</p>
      <p className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
        {displayIncome != null
          ? formatAmount(displayIncome, currency)
          : "—"}
      </p>

      {chartData.length === 0 ? (
        <p className="mt-8 flex flex-1 items-center justify-center text-sm text-zinc-400">
          No income in this range yet.
        </p>
      ) : (
        <div className="mt-6 flex flex-1 items-end justify-between gap-2 sm:gap-3">
          {chartData.map(({ label, incomePaise }, i) => (
            <div
              key={`${label}-${i}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-xl transition-all sm:max-w-12",
                  i === highlightIndex
                    ? "bg-violet-500 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.15)_0,rgba(255,255,255,0.15)_4px,transparent_4px,transparent_8px)]"
                    : "bg-zinc-200/80",
                )}
                style={{
                  height: `${(incomePaise / max) * 120 + 24}px`,
                }}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  i === highlightIndex ? "text-zinc-950" : "text-zinc-400",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
