"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { CategorizeWorkspace } from "@/components/transactions/categorize-workspace";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import type { EntitySummary } from "@/lib/entities/types";
import type { DateSortOrder } from "@/lib/transactions/sort-transactions";
import type { TransactionListRow } from "@/lib/transactions/types";

export function CategorizeDialog({
  transactions,
  mains,
  subsByMain,
  entities,
  importBatchId,
  dateSortOrder,
  onDateSortOrderChange,
  onClose,
}: {
  transactions: TransactionListRow[];
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
  importBatchId?: string | null;
  dateSortOrder: DateSortOrder;
  onDateSortOrderChange: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="categorize-dialog-title"
        className="relative z-10 flex min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-3xl dark:bg-zinc-900"
      >
        <span id="categorize-dialog-title" className="sr-only">
          Categorize transactions
        </span>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <CategorizeWorkspace
            transactions={transactions}
            mains={mains}
            subsByMain={subsByMain}
            entities={entities}
            importBatchId={importBatchId}
            dateSortOrder={dateSortOrder}
            onDateSortOrderChange={onDateSortOrderChange}
            onExit={onClose}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
