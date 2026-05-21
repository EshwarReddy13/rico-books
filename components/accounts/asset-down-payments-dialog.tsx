"use client";

import { Calendar, CheckCircle2, Clock, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { apiFetchAssetDownPayments } from "@/lib/accounts/account-api";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { AssetDownPaymentsView } from "@/lib/accounts/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function AssetDownPaymentsDialog({
  assetAccountId,
  assetName,
  onClose,
}: {
  assetAccountId: string;
  assetName: string;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AssetDownPaymentsView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetchAssetDownPayments(assetAccountId).then((result) => {
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
        setError("Could not load down payments.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [assetAccountId]);

  const title = view?.assetName ?? assetName;

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
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Down payments
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{title}</p>
            {view ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Total linked:{" "}
                <span className="font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {formatInrFromPaise(view.totalPaise)}
                </span>
                {view.count > 0 ? (
                  <span className="text-zinc-500"> · {view.count} transaction(s)</span>
                ) : null}
              </p>
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
            <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-600">{error}</p>
          ) : view && view.rows.length === 0 ? (
            <div className="space-y-2 py-6 text-center text-sm text-zinc-500">
              <p>No down payments linked yet.</p>
              <p className="text-xs">
                Categorize a bank debit to{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Assets → {title}
                </span>{" "}
                and confirm — the line will link here automatically.
              </p>
            </div>
          ) : view ? (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
              {view.rows.map((row) => (
                <li key={row.lineId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">
                        {row.description}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatDate(row.date)} · {row.categoryName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                        {formatInrFromPaise(row.amountPaise)}
                      </p>
                      {row.status === "confirmed" ? (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-emerald-600">
                          <CheckCircle2 className="size-3" aria-hidden />
                          Confirmed
                        </span>
                      ) : (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-amber-600">
                          <Clock className="size-3" aria-hidden />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <Link
            href="/transactions"
            className="flex items-center justify-center gap-1 text-xs font-medium text-violet-600 hover:underline"
          >
            Open transactions
            <ExternalLink className="size-3" />
          </Link>
          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
