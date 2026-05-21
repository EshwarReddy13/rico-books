"use client";

import { ChevronDown } from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";
import type { MonthlyPnlBucket } from "@/lib/metrics/types";

function buildPath(
  pts: { x: number; y: number }[],
): { d: string; coords: { x: number; y: number }[] } {
  const w = 100;
  const h = 100;
  const coords = pts.map((p) => ({
    x: (p.x / Math.max(pts.length - 1, 1)) * w,
    y: h - p.y * h,
  }));

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return { d, coords };
}

export function ReportsProfitTrendCard({
  trend,
}: {
  trend: MonthlyPnlBucket[];
}) {
  const { currency } = useCurrency();

  const maxProfit = Math.max(...trend.map((m) => m.profitPaise), 1);
  const points = trend.map((m, i) => ({
    x: i,
    y: Math.max(0, m.profitPaise) / maxProfit,
    profitPaise: m.profitPaise,
  }));

  const { d, coords } =
    points.length >= 2
      ? buildPath(points)
      : { d: "", coords: [] as { x: number; y: number }[] };

  const highlightIndex = Math.min(3, coords.length - 1);
  const highlight = coords[highlightIndex];
  const highlightProfit = trend[highlightIndex]?.profitPaise ?? 0;
  const areaPath = d ? `${d} L 100 100 L 0 100 Z` : "";

  return (
    <ReportCard className="flex min-h-[300px] flex-col">
      <ReportCardHeader
        title="Profit trend"
        action={
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
            This FY
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </span>
        }
      />

      {trend.length < 2 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          Need more months of data
        </p>
      ) : (
        <>
          <div className="relative flex-1 min-h-[200px]">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient id="profit-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(139 92 246 / 0.35)" />
                  <stop offset="100%" stopColor="rgb(139 92 246 / 0.02)" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={100 - y * 100}
                  x2="100"
                  y2={100 - y * 100}
                  className="stroke-zinc-100"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path d={areaPath} fill="url(#profit-fill)" />
              <path
                d={d}
                fill="none"
                className="stroke-violet-500"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {highlight ? (
                <>
                  <line
                    x1={highlight.x}
                    y1={highlight.y}
                    x2={highlight.x}
                    y2="100"
                    className="stroke-violet-300"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={highlight.x}
                    cy={highlight.y}
                    r="2"
                    className="fill-violet-500"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : null}
            </svg>

            {highlight ? (
              <span className="absolute left-[38%] top-[18%] rounded-lg bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
                {formatAmount(highlightProfit, currency)}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-zinc-400 sm:text-xs">
            {trend.map((m) => (
              <span key={m.label}>{m.label}</span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
