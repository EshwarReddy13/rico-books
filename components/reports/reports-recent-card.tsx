"use client";

import { ArrowRight, MoreVertical } from "lucide-react";
import Link from "next/link";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

const items = [
  {
    name: "Salary credit",
    date: "Apr 28, 2026",
    amountUsd: 1540,
    status: "confirmed" as const,
    avatar: "SC",
    avatarClass: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Office rent",
    date: "Apr 26, 2026",
    amountUsd: 420,
    status: "pending" as const,
    avatar: "OR",
    avatarClass: "bg-sky-100 text-sky-700",
  },
  {
    name: "Client payment",
    date: "Apr 24, 2026",
    amountUsd: 890,
    status: "confirmed" as const,
    avatar: "CP",
    avatarClass: "bg-violet-100 text-violet-700",
  },
] as const;

const statusStyles = {
  confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
} as const;

export function ReportsRecentCard() {
  const { currency } = useCurrency();

  return (
    <ReportCard className="flex h-full flex-col">
      <ReportCardHeader
        title="Recent activity"
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

      <ul className="space-y-1">
        {items.map((item) => {
          const status = statusStyles[item.status];
          return (
            <li key={item.name}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition hover:bg-zinc-50"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    item.avatarClass,
                  )}
                  aria-hidden
                >
                  {item.avatar}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-950">
                    {item.name}
                  </span>
                  <span className="block text-xs text-zinc-500">{item.date}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-zinc-950">
                    {formatAmount(item.amountUsd, currency)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </span>
                <MoreVertical
                  className="size-4 shrink-0 text-zinc-400"
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </ReportCard>
  );
}
