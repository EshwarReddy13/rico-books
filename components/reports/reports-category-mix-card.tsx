"use client";

import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import type { ReportsMetrics } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

export function ReportsCategoryMixCard({
  mix,
}: {
  mix: ReportsMetrics["expenseMix"] | null;
}) {
  const months = mix?.months ?? [];
  const legend = mix?.legend ?? [];

  const maxTotal = Math.max(
    ...months.map((m) =>
      m.segments.reduce((s, seg) => s + seg.amountPaise, 0),
    ),
    1,
  );

  return (
    <ReportCard className="flex h-full min-h-[280px] flex-col">
      <ReportCardHeader
        title="Expense mix"
        action={
          legend.length > 0 ? (
            <ul className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {legend.map(({ name, colorClass }) => (
                <li
                  key={name}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-600 sm:text-xs"
                >
                  <span
                    className={cn("size-2 rounded-full", colorClass)}
                    aria-hidden
                  />
                  {name}
                </li>
              ))}
            </ul>
          ) : null
        }
      />

      {months.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          No expenses this FY
        </p>
      ) : (
        <div className="flex flex-1 items-end justify-between gap-2 sm:gap-3">
          {months.map((month) => {
            const total = month.segments.reduce(
              (s, seg) => s + seg.amountPaise,
              0,
            );
            const heightPct = (total / maxTotal) * 100;

            return (
              <div
                key={month.label}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="flex w-full max-w-12 flex-col overflow-hidden rounded-full sm:max-w-14"
                  style={{ height: `${heightPct * 1.6 + 48}px` }}
                >
                  {month.segments.map((seg, i) => {
                    const segTotal = month.segments.reduce(
                      (s, x) => s + x.amountPaise,
                      0,
                    );
                    const flex =
                      segTotal > 0
                        ? Math.max(1, Math.round((seg.amountPaise / segTotal) * 4))
                        : 1;
                    const color =
                      legend[i]?.colorClass ?? "bg-zinc-300";
                    return (
                      <div key={seg.name} className="contents">
                        {i > 0 ? (
                          <span className="h-1 shrink-0 bg-zinc-200" aria-hidden />
                        ) : null}
                        <div
                          className={cn(
                            "flex items-center justify-center text-[9px] font-semibold text-white sm:text-[10px]",
                            color,
                          )}
                          style={{ flex }}
                        >
                          {seg.amountPaise > 0
                            ? Math.round(seg.amountPaise / 100)
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ReportCard>
  );
}
