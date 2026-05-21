"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import type { MonthlyPnlBucket } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

export function ReportsMonthlyFlowCard({
  flow,
}: {
  flow: MonthlyPnlBucket[];
}) {
  const max = Math.max(
    ...flow.map((m) => Math.max(m.incomePaise, m.expensePaise)),
    1,
  );
  const highlightIndex = flow.length - 1;

  return (
    <ReportCard className="flex h-full min-h-[260px] flex-col">
      <ReportCardHeader title="Monthly cash flow" />

      {flow.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          No data this FY
        </p>
      ) : (
        <div className="flex flex-1 items-end justify-between gap-2 pt-2 sm:gap-3">
          {flow.map((month, i) => {
            const value = month.incomePaise;
            const highlight = i === highlightIndex;

            return (
              <div
                key={month.label}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="relative flex w-full max-w-10 justify-center sm:max-w-12">
                  {!highlight ? (
                    <div
                      className="absolute bottom-0 w-full rounded-t-xl bg-zinc-100"
                      style={{ height: `${(value / max) * 100 + 20}px` }}
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={cn(
                      "relative w-full rounded-t-xl",
                      highlight ? "bg-violet-500" : "bg-zinc-200/90",
                    )}
                    style={{ height: `${(value / max) * 100 + 20}px` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium sm:text-xs",
                    highlight ? "text-zinc-950" : "text-zinc-400",
                  )}
                >
                  {month.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ReportCard>
  );
}
