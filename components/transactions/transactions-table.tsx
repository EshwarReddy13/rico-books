"use client";

import { Download, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { Checkbox } from "@/components/ui/checkbox";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

type TransactionStatus = "pending_review" | "confirmed";

type StatusFilter = "all" | TransactionStatus;

const rows = [
  {
    id: "1",
    date: "Oct 12, 2026",
    entity: "Jamie Smith",
    avatar: "JS",
    status: "confirmed" as TransactionStatus,
    amountUsd: 129,
    reference: "TXN-1",
    account: "HDFC Savings",
    category: "Operating",
  },
  {
    id: "2",
    date: "Oct 10, 2026",
    entity: "Acme Corp",
    avatar: "AC",
    status: "pending_review" as TransactionStatus,
    amountUsd: 450,
    reference: "TXN-2",
    account: "ICICI Current",
    category: "Uncategorized",
  },
  {
    id: "3",
    date: "Jan 28, 2026",
    entity: "Stone Supplies",
    avatar: "SS",
    status: "pending_review" as TransactionStatus,
    amountUsd: 89,
    reference: "TXN-3",
    account: "HDFC Savings",
    category: "Uncategorized",
  },
] as const;

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

export function TransactionsTable() {
  const { currency } = useCurrency();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRows = useMemo(
    () =>
      statusFilter === "all"
        ? rows
        : rows.filter((row) => row.status === statusFilter),
    [statusFilter],
  );

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
                    <Checkbox aria-label={`Select ${row.reference}`} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-zinc-700">
                    {row.date}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700"
                        aria-hidden
                      >
                        {row.avatar}
                      </span>
                      <span className="font-medium text-zinc-950">
                        {row.entity}
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
                  <td className="whitespace-nowrap px-3 py-4 font-semibold text-zinc-950">
                    {formatAmount(row.amountUsd, currency)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-zinc-700">
                    {row.reference}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-zinc-700">
                    {row.account}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 pr-6 text-zinc-600">
                    {row.category}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
