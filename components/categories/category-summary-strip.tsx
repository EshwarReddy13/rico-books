"use client";

import { ChevronDown } from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import type {
  CategoryPeriod,
  MainCategorySummary,
} from "@/lib/categories/types";
const periods: CategoryPeriod[] = ["This FY", "This month", "Last month"];

function kindBadge(main: MainCategorySummary) {
  if (main.kind === "pnl") {
    return main.pnlSign === "income" ? "P&L · Income" : "P&L · Expense";
  }
  return "Balance sheet";
}

export function CategorySummaryStrip({
  main,
  period,
  onPeriodChange,
  totalUsd,
  transactionCount,
  pendingReviewUsd,
  pendingReviewCount,
}: {
  main: MainCategorySummary;
  period: CategoryPeriod;
  onPeriodChange: (period: CategoryPeriod) => void;
  totalUsd: number;
  transactionCount: number;
  pendingReviewUsd: number;
  pendingReviewCount: number;
}) {
  const { currency } = useCurrency();
  const isBalanceSheet = main.kind === "balance_sheet";

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950">{main.name}</h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {kindBadge(main)}
            </span>
          </div>
          {main.description ? (
            <p className="mt-1 text-sm text-zinc-500">{main.description}</p>
          ) : null}
          {isBalanceSheet ? (
            <p className="mt-1 text-xs text-zinc-400">
              Totals show activity this period, not account balance.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700"
            onClick={() => {
              const i = periods.indexOf(period);
              onPeriodChange(periods[(i + 1) % periods.length]);
            }}
          >
            {period}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </button>
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              {isBalanceSheet ? "Activity" : "Total"}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-950">
              {formatAmount(totalUsd, currency)}
            </p>
            <p className="text-xs text-zinc-500">
              {transactionCount} transaction
              {transactionCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {pendingReviewCount > 0 ? (
        <p className="mt-3 text-xs text-amber-700">
          {formatAmount(pendingReviewUsd, currency)} in {pendingReviewCount}{" "}
          {pendingReviewCount === 1 ? "transaction" : "transactions"} awaiting
          review — not included in total above.
        </p>
      ) : null}
    </section>
  );
}
