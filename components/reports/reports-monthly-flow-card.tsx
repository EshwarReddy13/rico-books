"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { cn } from "@/lib/utils";

const months = [
  { label: "Jan", value: 52, highlight: false },
  { label: "Feb", value: 68, highlight: false },
  { label: "Mar", value: 45, highlight: false },
  { label: "Apr", value: 82, highlight: true },
  { label: "May", value: 61, highlight: false },
  { label: "Jun", value: 74, highlight: false },
] as const;

export function ReportsMonthlyFlowCard() {
  const max = Math.max(...months.map((m) => m.value));

  return (
    <ReportCard className="flex h-full min-h-[260px] flex-col">
      <ReportCardHeader title="Monthly cash flow" />

      <div className="flex flex-1 items-end justify-between gap-2 pt-2 sm:gap-3">
        {months.map(({ label, value, highlight }) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
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
                  highlight
                    ? "bg-violet-500"
                    : "bg-zinc-200/90",
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
              {label}
            </span>
          </div>
        ))}
      </div>
    </ReportCard>
  );
}
