"use client";

import { Calendar, CircleDollarSign, FileText } from "lucide-react";

import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { TransactionSummary } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

const cardConfig = [
  {
    key: "all" as const,
    label: "Total",
    icon: CircleDollarSign,
    gradient:
      "bg-[linear-gradient(135deg,#dbeafe_0%,#e9d5ff_50%,#fce7f3_100%)]",
    iconClassName: "bg-white/80 text-violet-700",
  },
  {
    key: "pendingReview" as const,
    label: "Pending review",
    icon: FileText,
    gradient:
      "bg-[linear-gradient(135deg,#ccfbf1_0%,#fef3c7_50%,#fed7aa_100%)]",
    iconClassName: "bg-white/80 text-teal-700",
  },
  {
    key: "confirmed" as const,
    label: "Confirmed",
    icon: Calendar,
    gradient:
      "bg-[linear-gradient(135deg,#fce7f3_0%,#fef9c3_50%,#ffedd5_100%)]",
    iconClassName: "bg-white/80 text-rose-600",
  },
];

export function TransactionsSummaryCards({
  summary,
  onPendingReviewClick,
}: {
  summary: TransactionSummary;
  onPendingReviewClick?: () => void;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cardConfig.map(({ key, label, icon: Icon, gradient, iconClassName }) => {
        const bucket = summary[key];
        const countLabel = `${bucket.count} transaction${bucket.count === 1 ? "" : "s"}`;
        const isPending = key === "pendingReview";
        const clickable = isPending && onPendingReviewClick && bucket.count > 0;

        const CardTag = clickable ? "button" : "article";

        return (
          <CardTag
            key={key}
            type={clickable ? "button" : undefined}
            onClick={clickable ? onPendingReviewClick : undefined}
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 text-left shadow-sm sm:rounded-3xl sm:p-6",
              gradient,
              clickable &&
                "cursor-pointer transition hover:ring-2 hover:ring-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                iconClassName,
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>

            <p className="mt-8 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              {formatInrFromPaise(bucket.totalPaise)}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{countLabel}</p>
            {clickable ? (
              <p className="mt-2 text-xs font-medium text-teal-800">
                Click to categorize →
              </p>
            ) : null}
          </CardTag>
        );
      })}
    </section>
  );
}
