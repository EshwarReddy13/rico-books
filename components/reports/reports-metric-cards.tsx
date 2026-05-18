"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { ProgressRing } from "@/components/reports/progress-ring";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount, type Currency } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "Net profit",
    amountUsd: 1655,
    progress: 72,
    trend: "+12%",
    trendUp: true,
    period: "This FY",
    icon: TrendingUp,
    iconBg: "bg-emerald-100 text-emerald-700",
    ringClassName: "text-emerald-500",
  },
  {
    label: "Total income",
    amountUsd: 12450,
    progress: 58,
    trend: "+8%",
    trendUp: true,
    period: "This FY",
    icon: ArrowDownLeft,
    iconBg: "bg-sky-100 text-sky-700",
    ringClassName: "text-sky-500",
  },
  {
    label: "Total expenses",
    amountUsd: 8420,
    progress: 45,
    trend: "-3%",
    trendUp: false,
    period: "This FY",
    icon: ArrowUpRight,
    iconBg: "bg-rose-100 text-rose-600",
    ringClassName: "text-rose-400",
  },
  {
    label: "Tax estimate",
    amountUsd: 2180,
    progress: 35,
    trend: "+5%",
    trendUp: true,
    period: "This FY",
    icon: Landmark,
    iconBg: "bg-violet-100 text-violet-700",
    ringClassName: "text-violet-500",
  },
] as const;

function MetricCard({
  label,
  amountUsd,
  progress,
  trend,
  trendUp,
  period,
  icon: Icon,
  iconBg,
  ringClassName,
  currency,
}: (typeof metrics)[number] & { currency: Currency }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            iconBg,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <ProgressRing percent={progress} strokeClassName={ringClassName} />
      </div>

      <p className="mt-4 text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
        {formatAmount(amountUsd, currency)}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
            trendUp
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-600",
          )}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </span>
        <span className="text-[10px] text-zinc-400 sm:text-xs">{period}</span>
      </div>
    </article>
  );
}

export function ReportsMetricCards() {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} currency={currency} />
      ))}
    </div>
  );
}
