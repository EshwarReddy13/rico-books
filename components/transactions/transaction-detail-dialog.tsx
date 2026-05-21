"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CategoryPickerPanel,
  type CategorySelection,
} from "@/components/transactions/category-picker-panel";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import { useSelectedEntityId } from "@/lib/dashboard/selected-entity";
import type { EntitySummary } from "@/lib/entities/types";
import { selectionFromRow } from "@/lib/transactions/categorize-helpers";
import { useAiLineDescription } from "@/lib/transactions/use-ai-line-description";
import { apiSaveTransactionCategorization } from "@/lib/transactions/transaction-api";
import type { TransactionListRow } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

const statusStyles = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-800",
  },
  pending_review: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800",
  },
} as const;

export function TransactionDetailDialog({
  transaction,
  mains,
  subsByMain,
  entities,
  onClose,
}: {
  transaction: TransactionListRow;
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
  onClose: () => void;
}) {
  const router = useRouter();
  const sessionEntityId = useSelectedEntityId(entities);
  const sessionEntityName =
    entities.find((e) => e.id === sessionEntityId)?.name ?? null;

  const [selection, setSelection] = useState<CategorySelection>(() =>
    selectionFromRow(transaction),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestionDismissed, setAiSuggestionDismissed] = useState(false);

  const isEmiSplit =
    transaction.isEmiSplit && transaction.lineCount > 1;

  const {
    description,
    setDescription,
    descriptionPending,
    descriptionError,
    resetDescription,
    suggestForSelection,
  } = useAiLineDescription({
    transactionId: transaction.id,
    rawDescription: transaction.rawDescription,
    amountPaise: transaction.amountPaise,
    direction: transaction.direction,
    entityName: sessionEntityName,
    mains,
    subsByMain,
    enabled: !isEmiSplit,
  });

  useEffect(() => {
    setSelection(selectionFromRow(transaction));
    resetDescription(
      transaction.lineDescription || transaction.rawDescription,
    );
    setAiSuggestionDismissed(false);
    setError(null);
  }, [transaction.id, resetDescription, transaction]);

  function handleSelectionChange(next: CategorySelection) {
    setSelection(next);
    setAiSuggestionDismissed(true);
    void suggestForSelection(next);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  const hasValidCategory = isEmiSplit
    ? transaction.isCategorized
    : Boolean(selection.mainCategoryId || selection.subCategoryId);

  const showAiSuggestion =
    transaction.hasAiSuggestion && !aiSuggestionDismissed;

  const status = statusStyles[transaction.status];

  async function handleSave() {
    if (!hasValidCategory) {
      setError(
        isEmiSplit
          ? "EMI split is not fully categorized."
          : "Choose a main or sub-category first.",
      );
      return;
    }

    if (
      !isEmiSplit &&
      selection.mainCategoryId &&
      !selection.subCategoryId &&
      (subsByMain[selection.mainCategoryId]?.length ?? 0) > 0
    ) {
      setError("This main category requires a sub-category.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await apiSaveTransactionCategorization(
      transaction.id,
      isEmiSplit
        ? {
            confirmOnly: true,
            entityId: sessionEntityId,
            confirm: true,
          }
        : {
            mainCategoryId: selection.mainCategoryId,
            subCategoryId: selection.subCategoryId,
            entityId: sessionEntityId,
            description,
            confirm: true,
          },
    );

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2
              id="transaction-detail-title"
              className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
            >
              Transaction
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">
              {transaction.rawDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Date</dt>
                <dd className="mt-0.5 font-medium text-zinc-950 dark:text-zinc-50">
                  {transaction.dateLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Amount</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-lg font-semibold tabular-nums",
                    transaction.direction === "credit"
                      ? "text-emerald-700"
                      : "text-zinc-950 dark:text-zinc-50",
                  )}
                >
                  {transaction.direction === "credit" ? "+" : "−"}
                  {formatInrFromPaise(transaction.amountPaise)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Category</dt>
                <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                  {transaction.categoryName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">
                  Bank account
                </dt>
                <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                  {transaction.accountName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Reference</dt>
                <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                  {transaction.referenceNo}
                </dd>
              </div>
              {transaction.entityName !== "—" ? (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Entity</dt>
                  <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                    {transaction.entityName}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-3">
              <dt className="text-xs font-medium text-zinc-500">
                Bank narration
              </dt>
              <dd className="mt-0.5 text-sm leading-snug text-zinc-800 dark:text-zinc-200">
                {transaction.rawDescription}
              </dd>
            </div>
          </div>

          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Categorize
            </h3>
            {sessionEntityName ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                Entity for this save:{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {sessionEntityName}
                </span>{" "}
                (side nav)
              </p>
            ) : null}

            {isEmiSplit ? (
              <div className="mt-4">
                <p className="text-xs text-zinc-500">
                  Interest and principal are set from the loan schedule. Confirm
                  to record this EMI.
                </p>
                <ul className="mt-3 space-y-2">
                  {transaction.splitLines.map((line, index) => (
                    <li
                      key={`${transaction.id}-split-${index}`}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {line.role === "interest" ? "Interest" : "Principal"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {line.categoryName}
                      </p>
                      <p className="mt-0.5 text-sm tabular-nums text-zinc-700">
                        {formatInrFromPaise(line.amountPaise)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3">
                <CategoryPickerPanel
                  mains={mains.filter((m) => !m.id.startsWith("placeholder-"))}
                  subsByMain={subsByMain}
                  selection={selection}
                  onSelectionChange={handleSelectionChange}
                  description={description}
                  onDescriptionChange={(value) => {
                    setDescription(value);
                    setAiSuggestionDismissed(true);
                  }}
                  aiSuggestion={
                    showAiSuggestion
                      ? { confidence: transaction.aiConfidence }
                      : null
                  }
                  descriptionPending={descriptionPending}
                  descriptionError={descriptionError}
                  disabled={pending}
                />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !hasValidCategory}
              className="h-11 flex-1 bg-zinc-950 text-white hover:bg-zinc-900"
              onClick={() => void handleSave()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" data-icon="inline-start" aria-hidden />
              )}
              {isEmiSplit ? "Confirm EMI" : "Save & confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
