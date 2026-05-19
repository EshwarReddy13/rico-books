"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { apiSaveTransactionCategorization } from "@/lib/transactions/transaction-api";
import {
  sortTransactionsByDate,
  type DateSortOrder,
} from "@/lib/transactions/sort-transactions";
import type { TransactionListRow } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";
import { DateSortToggle } from "@/components/transactions/date-sort-toggle";

function categoryLabelFromSelection(
  selection: CategorySelection,
  mains: MainCategorySummary[],
  subsByMain: Record<string, SubCategorySummary[]>,
): string {
  if (selection.subCategoryId) {
    for (const subs of Object.values(subsByMain)) {
      const sub = subs.find((s) => s.id === selection.subCategoryId);
      if (sub) {
        const main = mains.find((m) => m.id === sub.mainCategoryId);
        return main ? `${main.name} → ${sub.name}` : sub.name;
      }
    }
  }
  if (selection.mainCategoryId) {
    return (
      mains.find((m) => m.id === selection.mainCategoryId)?.name ?? "Categorized"
    );
  }
  return "Uncategorized";
}

function selectionFromRow(row: TransactionListRow): CategorySelection {
  return {
    mainCategoryId: row.mainCategoryId,
    subCategoryId: row.subCategoryId,
  };
}

export function CategorizeWorkspace({
  transactions,
  mains,
  subsByMain,
  entities,
  importBatchId,
  dateSortOrder,
  onDateSortOrderChange,
  onExit,
  embedded,
}: {
  transactions: TransactionListRow[];
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
  importBatchId?: string | null;
  dateSortOrder: DateSortOrder;
  onDateSortOrderChange: () => void;
  onExit: () => void;
  embedded?: boolean;
}) {
  const router = useRouter();
  const sessionEntityId = useSelectedEntityId(entities);
  const sessionEntityName =
    entities.find((e) => e.id === sessionEntityId)?.name ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selection, setSelection] = useState<CategorySelection>({
    mainCategoryId: null,
    subCategoryId: null,
  });
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(transactions);
  const [aiSuggestionDismissed, setAiSuggestionDismissed] = useState(false);

  useEffect(() => {
    setLocalRows(transactions);
  }, [transactions]);

  const activeQueue = useMemo(() => {
    let rows = localRows.filter((t) => t.status === "pending_review");
    if (importBatchId) {
      rows = rows.filter((t) => t.importBatchId === importBatchId);
    }
    return sortTransactionsByDate(rows, dateSortOrder, {
      uncategorizedFirst: true,
    });
  }, [localRows, importBatchId, dateSortOrder]);

  const selected = activeQueue.find((r) => r.id === selectedId) ?? activeQueue[0];

  useEffect(() => {
    if (!selectedId && activeQueue[0]) {
      setSelectedId(activeQueue[0].id);
    }
  }, [activeQueue, selectedId]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    setSelection(selectionFromRow(selected));
    setDescription(
      selected.lineDescription || selected.rawDescription,
    );
    setAiSuggestionDismissed(false);
    setError(null);
  }, [selected?.id]);

  const hasValidCategory = Boolean(
    selection.mainCategoryId || selection.subCategoryId,
  );

  const remaining = activeQueue.length;

  const showAiSuggestion =
    Boolean(selected?.hasAiSuggestion) && !aiSuggestionDismissed;

  const selectNext = useCallback(() => {
    if (!selected) {
      return;
    }
    const idx = activeQueue.findIndex((r) => r.id === selected.id);
    const next = activeQueue[idx + 1] ?? activeQueue[idx - 1];
    if (next) {
      setSelectedId(next.id);
    }
  }, [activeQueue, selected]);

  async function handleSave(advance: boolean) {
    if (!selected || !hasValidCategory) {
      setError("Choose a main or sub-category first.");
      return;
    }

    if (
      selection.mainCategoryId &&
      !selection.subCategoryId &&
      (subsByMain[selection.mainCategoryId]?.length ?? 0) > 0
    ) {
      setError("This main category requires a sub-category.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await apiSaveTransactionCategorization(selected.id, {
      mainCategoryId: selection.mainCategoryId,
      subCategoryId: selection.subCategoryId,
      entityId: sessionEntityId,
      description,
      confirm: true,
    });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const label = categoryLabelFromSelection(selection, mains, subsByMain);

    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === selected.id
          ? {
              ...row,
              status: "confirmed" as const,
              isCategorized: true,
              mainCategoryId: selection.mainCategoryId,
              subCategoryId: selection.subCategoryId,
              entityId: sessionEntityId,
              lineDescription: description,
              categoryName: label,
              hasAiSuggestion: false,
              aiConfidence: null,
            }
          : row,
      ),
    );

    router.refresh();

    if (advance) {
      const nextPending = activeQueue.filter(
        (r) => r.id !== selected.id && r.status === "pending_review",
      );
      const next = nextPending.find((r) => !r.isCategorized) ?? nextPending[0];
      if (next) {
        setSelectedId(next.id);
      } else {
        onExit();
      }
    }
  }

  if (activeQueue.length === 0) {
    return (
      <section
        className={cn(
          "rounded-2xl bg-white p-8 text-center shadow-sm sm:rounded-3xl",
          embedded && "border border-zinc-100 dark:border-zinc-800",
        )}
      >
        <p className="text-sm text-zinc-600">
          No transactions awaiting categorization
          {importBatchId ? " from this import" : ""}.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={onExit}>
          Back to transactions
        </Button>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex h-[min(82dvh,760px)] min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm sm:rounded-3xl",
        embedded && "h-[min(85dvh,760px)]",
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Categorize transactions
            </h2>
            <p className="text-xs text-zinc-500">
              {remaining} left · {activeQueue.length} in queue
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateSortToggle order={dateSortOrder} onToggle={onDateSortOrderChange} />
        </div>
        <p className="text-xs text-zinc-500">
          {sessionEntityName ? (
            <>
              Entity:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {sessionEntityName}
              </span>
              {" · "}
            </>
          ) : null}
          Save confirms each transaction.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-b border-zinc-100 lg:border-b-0 lg:border-r dark:border-zinc-800">
          {selected ? (
            <div className="shrink-0 bg-zinc-950 px-4 py-4 text-white sm:px-6">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Selected transaction
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {selected.rawDescription}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-300">
                <span>{selected.dateLabel}</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    selected.direction === "credit"
                      ? "text-emerald-400"
                      : "text-white",
                  )}
                >
                  {selected.direction === "credit" ? "+" : "−"}
                  {formatInrFromPaise(selected.amountPaise)}
                </span>
                <span>{selected.accountName}</span>
                {selected.referenceNo !== "—" ? (
                  <span className="truncate text-zinc-400">
                    {selected.referenceNo}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
              {activeQueue.map((row) => {
                const active = row.id === selected?.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition sm:px-6",
                        active
                          ? "bg-violet-50/80 dark:bg-violet-950/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          row.hasAiSuggestion
                            ? "bg-violet-500"
                            : row.isCategorized
                              ? "bg-emerald-500"
                              : "bg-amber-400",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {row.rawDescription}
                        </span>
                        <span className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500">
                          <span>{row.dateLabel}</span>
                          <span className="tabular-nums">
                            {row.direction === "credit" ? "+" : "−"}
                            {formatInrFromPaise(row.amountPaise)}
                          </span>
                          <span
                            className={cn(
                              row.hasAiSuggestion
                                ? "text-violet-700 dark:text-violet-400"
                                : row.isCategorized
                                  ? "text-emerald-700"
                                  : "text-amber-700",
                            )}
                          >
                            {row.hasAiSuggestion
                              ? `AI suggested · ${row.categoryName}`
                              : row.isCategorized
                                ? row.categoryName
                                : "Needs category"}
                          </span>
                        </span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 text-zinc-400",
                          active && "text-violet-600",
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden">
          <CategoryPickerPanel
            mains={mains.filter((m) => !m.id.startsWith("placeholder-"))}
            subsByMain={subsByMain}
            selection={selection}
            onSelectionChange={(next) => {
              setSelection(next);
              setAiSuggestionDismissed(true);
            }}
            description={description}
            onDescriptionChange={(value) => {
              setDescription(value);
              setAiSuggestionDismissed(true);
            }}
            aiSuggestion={
              showAiSuggestion
                ? {
                    confidence: selected?.aiConfidence ?? null,
                  }
                : null
            }
            disabled={pending}
          />

          <div className="shrink-0 space-y-2 border-t border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {error ? (
              <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={pending || !hasValidCategory}
              className="h-11 w-full bg-zinc-950 text-white hover:bg-zinc-900"
              onClick={() => handleSave(true)}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" data-icon="inline-start" aria-hidden />
              )}
              Save &amp; next
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                className="h-10"
                onClick={() => selectNext()}
              >
                <SkipForward className="size-4" data-icon="inline-start" />
                Skip
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || !hasValidCategory}
                className="h-10"
                onClick={() => handleSave(false)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
