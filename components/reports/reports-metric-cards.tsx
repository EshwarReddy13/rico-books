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
import type { ReportsMetrics } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

type MetricDef = {
  label: string;
  amountPaise: (m: ReportsMetrics) => number;
  progress: (m: ReportsMetrics) => number;
  trend: (m: ReportsMetrics) => { trend: string; trendUp: boolean };
  period: (m: ReportsMetrics) => string;
  icon: LucideIcon;
  iconBg: string;
  ringClassName: string;
};

const metricDefs: MetricDef[] = [
  {
    label: "Net profit",
    amountPaise: (m) => m.totals.profitPaise,
    progress: (m) => m.progress.profitPercent,
    trend: (m) => m.totals.profitTrend,
    period: (m) => m.periodLabel,
    icon: TrendingUp,
    iconBg: "bg-emerald-100 text-emerald-700",
    ringClassName: "text-emerald-500",
  },
  {
    label: "Total income",
    amountPaise: (m) => m.totals.incomePaise,
    progress: (m) => m.progress.incomePercent,
    trend: (m) => m.totals.incomeTrend,
    period: (m) => m.periodLabel,
    icon: ArrowDownLeft,
    iconBg: "bg-sky-100 text-sky-700",
    ringClassName: "text-sky-500",
  },
  {
    label: "Total expenses",
    amountPaise: (m) => m.totals.expensePaise,
    progress: (m) => m.progress.expensePercent,
    trend: (m) => m.totals.expenseTrend,
    period: (m) => m.periodLabel,
    icon: ArrowUpRight,
    iconBg: "bg-rose-100 text-rose-600",
    ringClassName: "text-rose-400",
  },
  {
    label: "Tax estimate",
    amountPaise: (m) => m.totals.taxEstimatePaise,
    progress: (m) => m.progress.taxPercent,
    trend: (m) => m.totals.taxTrend,
    period: (m) => m.periodLabel,
    icon: Landmark,
    iconBg: "bg-violet-100 text-violet-700",
    ringClassName: "text-violet-500",
  },
];

function MetricCard({
  label,
  amountPaise,
  progress,
  trend,
  trendUp,
  period,
  icon: Icon,
  iconBg,
  ringClassName,
  currency,
}: {
  label: string;
  amountPaise: number | null;
  progress: number;
  trend: string;
  trendUp: boolean;
  period: string;
  icon: LucideIcon;
  iconBg: string;
  ringClassName: string;
  currency: Currency;
}) {
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
        {amountPaise != null ? formatAmount(amountPaise, currency) : "—"}
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-400">30% of profit (estimate)</p>

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

export function ReportsMetricCards({
  metrics,
}: {
  metrics: ReportsMetrics | null;
}) {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-2 gap-3">
      {metricDefs.map((def) => (
        <MetricCard
          key={def.label}
          label={def.label}
          amountPaise={metrics ? def.amountPaise(metrics) : null}
          progress={metrics ? def.progress(metrics) : 0}
          trend={metrics ? def.trend(metrics).trend : "—"}
          trendUp={metrics ? def.trend(metrics).trendUp : true}
          period={metrics ? def.period(metrics) : "This FY"}
          icon={def.icon}
          iconBg={def.iconBg}
          ringClassName={def.ringClassName}
          currency={currency}
        />
      ))}
    </div>
  );
}
