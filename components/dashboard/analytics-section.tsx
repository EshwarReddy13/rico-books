"use client";

import { useState } from "react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

const periods = ["Week", "Month", "6 months", "Year"] as const;

const chartData = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 48 },
  { month: "Apr", value: 62 },
  { month: "May", value: 88, highlight: true },
  { month: "Jun", value: 70 },
];

export function AnalyticsSection() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("6 months");
  const { currency } = useCurrency();
  const max = Math.max(...chartData.map((d) => d.value));

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

      <p className="mt-4 text-sm text-zinc-500">Expected income</p>
      <p className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
        {formatAmount(1753, currency)}
      </p>

      <div className="mt-6 flex flex-1 items-end justify-between gap-2 sm:gap-3">
        {chartData.map(({ month, value, highlight }) => (
          <div
            key={month}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div
              className={cn(
                "w-full max-w-10 rounded-t-xl transition-all sm:max-w-12",
                highlight
                  ? "bg-violet-500 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.15)_0,rgba(255,255,255,0.15)_4px,transparent_4px,transparent_8px)]"
                  : "bg-zinc-200/80",
              )}
              style={{ height: `${(value / max) * 120 + 24}px` }}
            />
            <span
              className={cn(
                "text-xs font-medium",
                highlight ? "text-zinc-950" : "text-zinc-400",
              )}
            >
              {month}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
