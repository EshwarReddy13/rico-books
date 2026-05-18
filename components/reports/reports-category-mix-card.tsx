"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { cn } from "@/lib/utils";

const legend = [
  { label: "Operating", color: "bg-sky-400" },
  { label: "Personal", color: "bg-amber-400" },
  { label: "Tax", color: "bg-violet-500" },
] as const;

const bars = [
  { operating: 42, personal: 28, tax: 12 },
  { operating: 55, personal: 18, tax: 8 },
  { operating: 38, personal: 32, tax: 15 },
  { operating: 48, personal: 22, tax: 10 },
  { operating: 62, personal: 14, tax: 9 },
  { operating: 35, personal: 30, tax: 18 },
] as const;

export function ReportsCategoryMixCard() {
  const maxTotal = Math.max(
    ...bars.map((b) => b.operating + b.personal + b.tax),
  );

  return (
    <ReportCard className="flex h-full min-h-[280px] flex-col">
      <ReportCardHeader
        title="Expense mix"
        action={
          <ul className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {legend.map(({ label, color }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 sm:text-xs"
              >
                <span className={cn("size-2 rounded-full", color)} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        }
      />

      <div className="flex flex-1 items-end justify-between gap-2 sm:gap-3">
        {bars.map((bar, i) => {
          const total = bar.operating + bar.personal + bar.tax;
          const heightPct = (total / maxTotal) * 100;

          return (
            <div
              key={i}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="flex w-full max-w-12 flex-col overflow-hidden rounded-full sm:max-w-14"
                style={{ height: `${heightPct * 1.6 + 48}px` }}
              >
                <div className="flex flex-[2] items-center justify-center bg-sky-400 text-[9px] font-semibold text-white sm:text-[10px]">
                  {bar.operating}
                </div>
                <span className="h-1 shrink-0 bg-zinc-200" aria-hidden />
                <div className="flex flex-1 items-center justify-center bg-amber-400 text-[9px] font-semibold text-white sm:text-[10px]">
                  {bar.personal}
                </div>
                <span className="h-1 shrink-0 bg-zinc-200" aria-hidden />
                <div className="flex flex-1 items-center justify-center bg-violet-500 text-[9px] font-semibold text-white sm:text-[10px]">
                  {bar.tax}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ReportCard>
  );
}
