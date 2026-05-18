"use client";

import { Calendar, CircleDollarSign, FileText } from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

const cards = [
  {
    label: "Total Open",
    countLabel: "0 Transactions",
    amountUsd: 0,
    icon: CircleDollarSign,
    gradient:
      "bg-[linear-gradient(135deg,#dbeafe_0%,#e9d5ff_50%,#fce7f3_100%)]",
    iconClassName: "bg-white/80 text-violet-700",
  },
  {
    label: "Pending Review",
    countLabel: "0 Transactions",
    amountUsd: 0,
    icon: FileText,
    gradient:
      "bg-[linear-gradient(135deg,#ccfbf1_0%,#fef3c7_50%,#fed7aa_100%)]",
    iconClassName: "bg-white/80 text-teal-700",
  },
  {
    label: "Confirmed",
    countLabel: "0 Transactions",
    amountUsd: 0,
    icon: Calendar,
    gradient:
      "bg-[linear-gradient(135deg,#fce7f3_0%,#fef9c3_50%,#ffedd5_100%)]",
    iconClassName: "bg-white/80 text-rose-600",
  },
] as const;

export function TransactionsSummaryCards() {
  const { currency } = useCurrency();

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cards.map(
        ({ label, countLabel, amountUsd, icon: Icon, gradient, iconClassName }) => (
          <article
            key={label}
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 shadow-sm sm:rounded-3xl sm:p-6",
              gradient,
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
              {formatAmount(amountUsd, currency)}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{countLabel}</p>
          </article>
        ),
      )}
    </section>
  );
}
