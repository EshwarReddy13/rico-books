"use client";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";
import type { SubCategoryBreakdown } from "@/lib/categories/types";

export function CategoryMixChartCard({
  mainName,
  totalUsd,
  subs,
}: {
  mainName: string;
  totalUsd: number;
  subs: SubCategoryBreakdown[];
}) {
  const { currency } = useCurrency();

  let offset = 0;
  const segments = subs.map((sub) => {
    const segment = {
      percent: sub.sharePercent,
      strokeClassName: sub.strokeClassName,
      offset,
      name: sub.name,
    };
    offset += sub.sharePercent;
    return segment;
  });

  return (
    <ReportCard className="flex min-w-0 flex-col">
      <ReportCardHeader title="Breakdown" />

      {subs.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          No data for this period.
        </p>
      ) : (
        <>
          <div className="relative mx-auto flex aspect-[4/3] w-full max-w-[220px] items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className="stroke-zinc-100"
                strokeWidth="3"
              />
              {segments.map((seg) => (
                <circle
                  key={seg.name}
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className={seg.strokeClassName}
                  strokeWidth="3"
                  pathLength={100}
                  strokeDasharray={`${seg.percent} 100`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p className="text-xs text-zinc-500">{mainName}</p>
              <p className="text-lg font-semibold text-zinc-950 sm:text-xl">
                {formatAmount(totalUsd, currency)}
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {subs.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-full ${sub.barClassName}`}
                    aria-hidden
                  />
                  <span className="truncate text-zinc-700">{sub.name}</span>
                </span>
                <span className="shrink-0 font-medium text-zinc-950">
                  {sub.sharePercent}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ReportCard>
  );
}
