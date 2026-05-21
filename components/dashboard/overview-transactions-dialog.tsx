"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import { fetchOverviewTransactions } from "@/lib/metrics/metrics-api";
import type { OverviewTransactionsResult } from "@/lib/metrics/list-overview-transactions";
import {
  OVERVIEW_CARD_LABELS,
  type OverviewCardKind,
} from "@/lib/metrics/overview-transaction-filter";
import type {
  OverviewCustomRange,
  OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";
import { overviewLineAmountDisplay } from "@/lib/metrics/overview-line-display";
import { cn } from "@/lib/utils";

export function OverviewTransactionsDialog({
  kind,
  entityId,
  period,
  customRange,
  onClose,
}: {
  kind: OverviewCardKind;
  entityId: string | null;
  period: OverviewPeriodPreset;
  customRange: OverviewCustomRange | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [data, setData] = useState<OverviewTransactionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOverviewTransactions(
      entityId,
      period,
      kind,
      period === "custom" ? customRange : undefined,
    )
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load transactions",
          );
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, period, kind, customRange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = OVERVIEW_CARD_LABELS[kind];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overview-txn-title"
        className="relative flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="overview-txn-title"
              className="text-lg font-semibold text-zinc-950"
            >
              {title}
            </h2>
            {data ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                {data.periodLabel} · {data.dateRangeLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : error ? (
            <p className="py-12 text-center text-sm text-rose-600">{error}</p>
          ) : data ? (
            <>
              <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-3">
                {kind === "profit" ? (
                  <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <dt className="text-zinc-500">Income</dt>
                      <dd className="mt-0.5 font-semibold text-emerald-700">
                        {formatAmount(data.incomePaise, currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Expenses</dt>
                      <dd className="mt-0.5 font-semibold text-rose-600">
                        {formatAmount(data.expensePaise, currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Net</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-950">
                        {formatAmount(data.totalPaise, currency)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-center">
                    <span className="text-xs text-zinc-500">Total</span>
                    <span className="mt-0.5 block text-xl font-semibold text-zinc-950">
                      {formatAmount(data.totalPaise, currency)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {data.items.length} line
                      {data.items.length === 1 ? "" : "s"}
                    </span>
                  </p>
                )}
              </div>

              {data.items.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No confirmed {kind === "profit" ? "P&L" : kind} lines in this
                  period.
                </p>
              ) : (
                <ul className="space-y-1">
                  {data.items.map((item) => {
                    const display = overviewLineAmountDisplay(
                      item.pnlSign,
                      item.direction,
                    );
                    return (
                      <li key={item.lineId}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push(
                              `/transactions?highlight=${item.transactionId}`,
                            );
                          }}
                          className="flex w-full flex-col gap-1 rounded-xl px-2 py-2.5 text-left transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="block truncate text-sm font-medium text-zinc-950">
                                {item.description}
                              </span>
                              {display.hint ? (
                                <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  {display.hint}
                                </span>
                              ) : null}
                            </span>
                            <span className="block truncate text-xs text-zinc-500">
                              {item.date} · {item.categoryLabel} ·{" "}
                              {item.entityName}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-semibold tabular-nums",
                              display.className,
                            )}
                          >
                            {display.prefix}
                            {formatAmount(item.amountPaise, currency)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </div>

        <footer className="border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/transactions");
            }}
            className="text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Open all transactions →
          </button>
        </footer>
      </div>
    </div>
  );
}
