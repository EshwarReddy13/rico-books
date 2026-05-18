"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";

const segments = [
  { percent: 42, color: "stroke-sky-400", offset: 0 },
  { percent: 28, color: "stroke-violet-500", offset: 42 },
  { percent: 30, color: "stroke-zinc-700", offset: 70 },
] as const;

export function ReportsSpendingDonutCard() {
  const { currency } = useCurrency();

  return (
    <ReportCard className="flex h-full flex-col">
      <ReportCardHeader title="Spending by category" />

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
          {segments.map(({ percent, color, offset }) => (
            <circle
              key={offset}
              cx="18"
              cy="18"
              r="14"
              fill="none"
              className={color}
              strokeWidth="3"
              pathLength={100}
              strokeDasharray={`${percent} 100`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-zinc-500">Total spend</p>
          <p className="text-xl font-semibold text-zinc-950 sm:text-2xl">
            {formatAmount(8420, currency)}
          </p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            ↑ 4.2%
          </span>
        </div>
      </div>
    </ReportCard>
  );
}
