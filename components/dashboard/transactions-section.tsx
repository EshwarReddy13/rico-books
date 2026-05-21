"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import type { DashboardMetrics } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

export function TransactionsSection({
  transactions,
}: {
  transactions: DashboardMetrics["recentTransactions"];
}) {
  const { currency } = useCurrency();

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-950">Transactions</h2>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 sm:text-sm"
        >
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          No transactions yet.{" "}
          <Link href="/transactions" className="text-violet-600 hover:underline">
            Import or add
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm font-medium text-zinc-500">
            {transactions[0]?.dateLabel ?? "Recent"}
          </p>
          <ul className="mt-3 space-y-1">
            {transactions.map((txn) => (
              <li key={txn.id}>
                <Link
                  href={`/transactions?highlight=${txn.id}`}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-zinc-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {txn.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {txn.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      txn.isDebit ? "text-zinc-950" : "text-emerald-600",
                    )}
                  >
                    {txn.isDebit ? "−" : "+"}
                    {formatAmount(txn.amountPaise, currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
