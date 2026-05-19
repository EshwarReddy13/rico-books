"use client";

import { Download, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import { DateSortToggle } from "@/components/transactions/date-sort-toggle";
import {
  sortTransactionsByDate,
  type DateSortOrder,
} from "@/lib/transactions/sort-transactions";
import type {
  TransactionListRow,
  TransactionStatus,
} from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | TransactionStatus;

const statusStyles: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-800",
  },
  pending_review: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800",
  },
};

const filters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending_review", label: "Pending review" },
  { id: "confirmed", label: "Confirmed" },
];

export function TransactionsTable({
  transactions,
  dateSortOrder,
  onDateSortOrderChange,
  onStartCategorize,
}: {
  transactions: TransactionListRow[];
  dateSortOrder: DateSortOrder;
  onDateSortOrderChange: () => void;
  onStartCategorize?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRows = useMemo(() => {
    const filtered =
      statusFilter === "all"
        ? transactions
        : transactions.filter((row) => row.status === statusFilter);
    return sortTransactionsByDate(filtered, dateSortOrder);
  }, [transactions, statusFilter, dateSortOrder]);

  const sectionTitle =
    statusFilter === "pending_review"
      ? "Awaiting review"
      : statusFilter === "confirmed"
        ? "Confirmed"
        : "All transactions";

  return (
    <section className="min-w-0 max-w-full rounded-2xl bg-white shadow-sm sm:rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <h2 className="text-lg font-semibold text-zinc-950">{sectionTitle}</h2>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm",
                statusFilter === id
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              )}
            >
              {label}
            </button>
          ))}
          <DateSortToggle
            order={dateSortOrder}
            onToggle={onDateSortOrderChange}
          />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Add filters
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
          >
            <Download className="size-3.5" aria-hidden />
            Export all
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            <p>
              {transactions.length === 0
                ? "No transactions yet. Import a bank statement to get started."
                : "No transactions match this filter."}
            </p>
            {statusFilter === "pending_review" &&
            onStartCategorize &&
            transactions.filter((t) => t.status === "pending_review").length >
              0 ? (
              <button
                type="button"
                onClick={onStartCategorize}
                className="mt-4 text-sm font-medium text-violet-700 hover:underline"
              >
                Open categorization workspace
              </button>
            ) : null}
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500">
                <th className="w-10 px-4 py-3 sm:px-6">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Entity</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Reference</th>
                <th className="px-3 py-3 font-medium">Account</th>
                <th className="px-3 py-3 pr-6 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const status = statusStyles[row.status];
                return (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <Checkbox
                        aria-label={`Select ${row.referenceNo}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-zinc-700">
                      {row.dateLabel}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700"
                          aria-hidden
                          title={row.rawDescription}
                        >
                          {row.entityInitials}
                        </span>
                        <span
                          className="max-w-[200px] truncate font-medium text-zinc-950"
                          title={row.rawDescription}
                        >
                          {row.entityName === "—"
                            ? row.rawDescription
                            : row.entityName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-4 font-semibold tabular-nums",
                        row.direction === "credit"
                          ? "text-emerald-700"
                          : "text-zinc-950",
                      )}
                    >
                      {row.direction === "credit" ? "+" : "−"}
                      {formatInrFromPaise(row.amountPaise)}
                    </td>
                    <td className="max-w-[140px] truncate whitespace-nowrap px-3 py-4 text-zinc-700">
                      {row.referenceNo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-zinc-700">
                      {row.accountName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 pr-6 text-zinc-600">
                      {row.categoryName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
