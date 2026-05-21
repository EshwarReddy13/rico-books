"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import type { ReportsMetrics } from "@/lib/metrics/types";

export function ReportsSpendingDonutCard({
  donut,
}: {
  donut: ReportsMetrics["spendingDonut"] | null;
}) {
  const { currency } = useCurrency();
  const segments = donut?.segments ?? [];
  let offset = 0;

  return (
    <ReportCard className="flex h-full flex-col">
      <ReportCardHeader title="Spending by category" />

      {segments.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          No expenses this FY
        </p>
      ) : (
        <div className="relative mx-auto flex aspect-square w-full max-w-[200px] flex-1 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              className="stroke-zinc-100"
              strokeWidth="3"
            />
            {segments.map(({ percent, colorClass, name }) => {
              const seg = (
                <circle
                  key={name}
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className={colorClass}
                  strokeWidth="3"
                  pathLength={100}
                  strokeDasharray={`${percent} 100`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += percent;
              return seg;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-zinc-500">Total spend</p>
            <p className="text-xl font-semibold text-zinc-950 sm:text-2xl">
              {donut
                ? formatAmount(donut.totalPaise, currency)
                : "—"}
            </p>
            {donut ? (
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  donut.trend.trendUp
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {donut.trend.trendUp ? "↑" : "↓"} {donut.trend.trend}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </ReportCard>
  );
}
