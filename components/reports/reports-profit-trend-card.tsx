"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";

const periods = ["This FY", "Last FY", "All time"] as const;

const points = [
  { x: 0, y: 0.35 },
  { x: 1, y: 0.48 },
  { x: 2, y: 0.42 },
  { x: 3, y: 0.72, label: true },
  { x: 4, y: 0.58 },
  { x: 5, y: 0.65 },
  { x: 6, y: 0.55 },
  { x: 7, y: 0.68 },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function buildPath(pts: typeof points) {
  const w = 100;
  const h = 100;
  const coords = pts.map((p) => ({
    x: (p.x / (pts.length - 1)) * w,
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

export function ReportsProfitTrendCard() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("This FY");
  const { currency } = useCurrency();
  const { d, coords } = buildPath(points);
  const highlight = coords[3];
  const areaPath = `${d} L 100 100 L 0 100 Z`;

  return (
    <ReportCard className="flex min-h-[300px] flex-col">
      <ReportCardHeader
        title="Profit trend"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700"
            onClick={() =>
              setPeriod((current) => {
                const i = periods.indexOf(current);
                return periods[(i + 1) % periods.length];
              })
            }
          >
            {period}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </button>
        }
      />

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
        </svg>

        <span className="absolute left-[38%] top-[18%] rounded-lg bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
          {formatAmount(4740, currency)}
        </span>
      </div>

      <div className="mt-3 flex justify-between text-[10px] text-zinc-400 sm:text-xs">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

    </ReportCard>
  );
}
