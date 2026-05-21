"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";
import type { CategoryRecentTransaction } from "@/lib/categories/types";
import { cn } from "@/lib/utils";

const statusStyles = {
  confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" },
  pending_review: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  },
} as const;

export function CategoryRecentCard({
  mainName,
  items,
}: {
  mainName: string;
  items: CategoryRecentTransaction[];
}) {
  const { currency } = useCurrency();

  return (
    <ReportCard className="flex min-w-0 flex-col">
      <ReportCardHeader
        title={`Recent in ${mainName}`}
        action={
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          No confirmed transactions in this period.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const status = statusStyles[item.status];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 rounded-xl px-1 py-2.5 text-left transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-950">
                      {item.description}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {item.date} · {item.subCategory} · {item.entity}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 sm:text-right">
                    <span className="text-sm font-semibold text-zinc-950">
                      {formatAmount(item.amountPaise, currency)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ReportCard>
  );
}
