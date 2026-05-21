"use client";

import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { apiFetchLoanSchedule } from "@/lib/accounts/account-api";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type {
  LoanScheduleView,
  SchedulePaymentStatus,
} from "@/lib/loans/types";
import { cn } from "@/lib/utils";

function formatDueDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function PaymentStatusBadge({ status }: { status: SchedulePaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        <CheckCircle2 className="size-3" aria-hidden />
        Paid
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
        <Clock className="size-3" aria-hidden />
        Linked · confirm EMI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      <Circle className="size-3" aria-hidden />
      Due
    </span>
  );
}

export function LoanScheduleViewDialog({
  loanId,
  liabilityName,
  onClose,
}: {
  loanId: string;
  liabilityName: string;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<LoanScheduleView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetchLoanSchedule(loanId).then((result) => {
      if (cancelled) {
        return;
      }
      setPending(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.view) {
        setView(result.view);
      } else {
        setError("Could not load schedule.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loanId]);

  const title = view?.liabilityName ?? liabilityName;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Repayment schedule
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{title}</p>
            {view ? (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                    Outstanding
                  </span>{" "}
                  <span className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                    {formatInrFromPaise(view.outstandingBalancePaise)}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {view.paidCount}
                  </span>{" "}
                  paid ·{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {view.pendingCount}
                  </span>{" "}
                  linked ·{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {view.totalCount - view.matchedCount}
                  </span>{" "}
                  due
                </p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {pending ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Loading schedule…
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-600">{error}</p>
          ) : view && view.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No schedule rows yet. Import an amortization PDF from the liability
              form.
            </p>
          ) : view ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/80">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">EMI</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Balance after</th>
                    <th className="px-3 py-2">Bank transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {view.rows.map((row) => {
                    const linked = row.matchedTransaction != null;
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          row.paymentStatus === "paid"
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : row.paymentStatus === "pending"
                              ? "bg-amber-50/40 dark:bg-amber-950/15"
                              : "bg-white dark:bg-zinc-900",
                        )}
                      >
                        <td className="px-3 py-2.5 tabular-nums">
                          {row.installmentNo}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5 text-zinc-400" />
                            {formatDueDate(row.dueDate)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <PaymentStatusBadge status={row.paymentStatus} />
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatInrFromPaise(row.emiAmountPaise)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                          {formatInrFromPaise(row.principalAmountPaise)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                          {formatInrFromPaise(row.interestAmountPaise)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                          {formatInrFromPaise(row.closingBalancePaise)}
                        </td>
                        <td className="px-3 py-2.5">
                          {linked && row.matchedTransaction ? (
                            <div className="min-w-0 max-w-[14rem]">
                              <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">
                                {row.matchedTransaction.rawDescription}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {formatDueDate(row.matchedTransaction.date)} ·{" "}
                                {formatInrFromPaise(
                                  row.matchedTransaction.amountPaise,
                                )}
                              </p>
                              <Link
                                href="/transactions"
                                className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-violet-600 hover:underline"
                              >
                                Open transactions
                                <ExternalLink className="size-3" />
                              </Link>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <p className="mb-3 text-xs text-zinc-500">
            Outstanding = amount financed minus principal on linked EMIs.
            Balance after = lender schedule after each instalment.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
