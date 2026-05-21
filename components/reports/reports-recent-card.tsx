"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";
import type { RecentLineItem } from "@/lib/metrics/types";

export function ReportsRecentCard({ items }: { items: RecentLineItem[] }) {
  const { currency } = useCurrency();

  return (
    <ReportCard className="flex h-full flex-col">
      <ReportCardHeader
        title="Recent expenses"
        action={
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
          >
            See all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        }
      />

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No confirmed expenses this FY.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/transactions?highlight=${item.transactionId}`}
                className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition hover:bg-zinc-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-950">
                    {item.description}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {item.date} · {item.subCategory}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-zinc-950">
                  {formatAmount(item.amountPaise, currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
