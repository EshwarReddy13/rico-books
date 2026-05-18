"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

const cards = [
  {
    label: "Profit",
    amountUsd: 1655,
    trend: "+12%",
    trendUp: true,
    icon: TrendingUp,
    className: "bg-[#e5f5ee]",
    decorClassName: "bg-emerald-300/40",
    iconClassName: "text-emerald-700",
  },
  {
    label: "Income",
    amountUsd: 435,
    trend: "+4%",
    trendUp: true,
    icon: ArrowDownLeft,
    className: "bg-[#e3f0fa]",
    decorClassName: "bg-sky-300/40",
    iconClassName: "text-sky-700",
  },
  {
    label: "Expenses",
    amountUsd: 842,
    trend: "-2%",
    trendUp: false,
    icon: ArrowUpRight,
    className: "bg-[#fce8ea]",
    decorClassName: "bg-rose-300/40",
    iconClassName: "text-rose-700",
  },
] as const;

export function OverviewCards() {
  const { currency } = useCurrency();

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(
          ({
            label,
            amountUsd,
            trend,
            trendUp,
            icon: Icon,
            className,
            decorClassName,
            iconClassName,
          }) => (
            <article
              key={label}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-5",
                className,
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full bg-white/70",
                    iconClassName,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <button
                  type="button"
                  className="rounded-full p-1 text-zinc-500 transition hover:bg-white/50"
                  aria-label={`${label} options`}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              <p className="mt-6 text-sm text-zinc-600">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                {formatAmount(amountUsd, currency)}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  trendUp ? "text-emerald-600" : "text-rose-500",
                )}
              >
                {trend}
              </p>

              <div
                className={cn(
                  "pointer-events-none absolute -right-4 -bottom-6 size-24 rounded-full blur-sm sm:size-28",
                  decorClassName,
                )}
                aria-hidden
              />
            </article>
          ),
        )}
      </div>
    </section>
  );
}
