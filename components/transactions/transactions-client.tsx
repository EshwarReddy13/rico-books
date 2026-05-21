"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CategorizeDialog } from "@/components/transactions/categorize-dialog";
import {
  CategorizeModePrompt,
  type CategorizeMode,
} from "@/components/transactions/categorize-mode-prompt";
import { CategorizeWorkspace } from "@/components/transactions/categorize-workspace";
import { TransactionsActions } from "@/components/transactions/transactions-actions";
import { TransactionsSummaryCards } from "@/components/transactions/transactions-summary-cards";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import { useSelectedEntityId } from "@/lib/dashboard/selected-entity";
import type { EntitySummary } from "@/lib/entities/types";
import { buildInitialAiProgress } from "@/lib/transactions/ai-categorize-progress";
import {
  filterTransactionsByEntity,
  summaryFromTransactionRows,
} from "@/lib/transactions/filter-by-entity";
import type { AiCategorizeProgress } from "@/lib/transactions/ai-categorize-progress";
import { apiResetPendingCategorization } from "@/lib/transactions/categorize-api";
import { runAiCategorizeBatched } from "@/lib/transactions/run-ai-categorize-batched";
import {
  toggleDateSortOrder,
  type DateSortOrder,
} from "@/lib/transactions/sort-transactions";
import type { TransactionListRow } from "@/lib/transactions/types";

type ViewMode = "list" | "categorize";
type CategorizeTarget = "workspace" | "dialog";

export function TransactionsClient({
  transactions,
  mains,
  subsByMain,
  entities,
}: {
  transactions: TransactionListRow[];
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [categorizeDialogOpen, setCategorizeDialogOpen] = useState(false);
  const [categorizeBatchId, setCategorizeBatchId] = useState<string | null>(
    null,
  );
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>("desc");
  const [detailTransactionId, setDetailTransactionId] = useState<
    string | null
  >(null);

  const [modePromptOpen, setModePromptOpen] = useState(false);
  const [modePromptPending, setModePromptPending] = useState(false);
  const [aiProgress, setAiProgress] = useState<AiCategorizeProgress | null>(
    null,
  );
  const [modePromptError, setModePromptError] = useState<string | null>(null);
  const [modePromptBatchId, setModePromptBatchId] = useState<string | null>(
    null,
  );
  const [afterPromptTarget, setAfterPromptTarget] =
    useState<CategorizeTarget>("workspace");
  const urlPromptHandled = useRef(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const selectedEntityId = useSelectedEntityId(entities);
  const selectedEntityName =
    entities.find((e) => e.id === selectedEntityId)?.name ?? null;

  const entityFilteredTransactions = useMemo(
    () => filterTransactionsByEntity(transactions, selectedEntityId),
    [transactions, selectedEntityId],
  );

  const entityFilteredSummary = useMemo(
    () => summaryFromTransactionRows(entityFilteredTransactions),
    [entityFilteredTransactions],
  );

  const detailTransaction = useMemo(
    () =>
      detailTransactionId
        ? entityFilteredTransactions.find((t) => t.id === detailTransactionId) ??
          null
        : null,
    [detailTransactionId, entityFilteredTransactions],
  );

  function handleDateSortToggle() {
    setDateSortOrder((prev) => toggleDateSortOrder(prev));
  }

  const pendingForPrompt = useMemo(() => {
    let rows = entityFilteredTransactions.filter(
      (t) => t.status === "pending_review",
    );
    if (modePromptBatchId) {
      rows = rows.filter((t) => t.importBatchId === modePromptBatchId);
    }
    return rows;
  }, [entityFilteredTransactions, modePromptBatchId]);

  function requestCategorize(
    target: CategorizeTarget,
    batchId?: string | null,
  ) {
    setModePromptBatchId(batchId ?? null);
    setAfterPromptTarget(target);
    setModePromptError(null);
    setAiProgress(null);
    setModePromptOpen(true);
  }

  function openCategorizeWorkspace(batchId?: string | null) {
    setCategorizeBatchId(batchId ?? null);
    setViewMode("categorize");
  }

  function openCategorizeDialog(batchId?: string | null) {
    setCategorizeBatchId(batchId ?? null);
    setCategorizeDialogOpen(true);
  }

  function finishModePrompt() {
    setModePromptOpen(false);
    if (afterPromptTarget === "dialog") {
      openCategorizeDialog(modePromptBatchId);
    } else {
      openCategorizeWorkspace(modePromptBatchId);
    }
  }

  async function handleConfirmCategorizeMode(mode: CategorizeMode) {
    setModePromptPending(true);
    setModePromptError(null);

    if (mode === "manual") {
      const result = await apiResetPendingCategorization({
        importBatchId: modePromptBatchId,
      });
      setModePromptPending(false);
      if (result.error) {
        setModePromptError(result.error);
        return;
      }
      router.refresh();
      finishModePrompt();
      return;
    }

    const transactionIds = pendingForPrompt.map((t) => t.id);
    aiAbortRef.current?.abort();
    aiAbortRef.current = new AbortController();

    setAiProgress(buildInitialAiProgress(transactionIds.length));

    const result = await runAiCategorizeBatched({
      importBatchId: modePromptBatchId,
      transactionIds,
      onProgress: setAiProgress,
      signal: aiAbortRef.current.signal,
    });

    aiAbortRef.current = null;
    setModePromptPending(false);
    setAiProgress(null);

    if (result.cancelled) {
      return;
    }

    if (result.error) {
      setModePromptError(result.error);
      return;
    }

    router.refresh();
    finishModePrompt();
  }

  function handleCancelAiCategorization() {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setModePromptPending(false);
    setAiProgress(null);
  }

  useEffect(() => {
    const batch = searchParams.get("batch");
    const wantsPrompt = searchParams.get("prompt") === "1";
    const wantsCategorize = searchParams.get("categorize") === "1";

    if (wantsPrompt && !urlPromptHandled.current) {
      urlPromptHandled.current = true;
      setModePromptBatchId(batch);
      setAfterPromptTarget("workspace");
      setModePromptError(null);
      setModePromptOpen(true);
      router.replace("/transactions", { scroll: false });
      return;
    }

    if (wantsCategorize && !wantsPrompt) {
      setCategorizeBatchId(batch);
      setViewMode("categorize");
    }
  }, [searchParams, router]);

  return (
    <>
      <div className="flex min-w-0 w-full max-w-full flex-col gap-6">
        {selectedEntityName ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing transactions for{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedEntityName}
            </span>
            . Change entity in the side nav.
          </p>
        ) : null}
        <TransactionsActions
          onCategorizeDialogOpen={() => requestCategorize("dialog")}
        />
        <TransactionsSummaryCards
          summary={entityFilteredSummary}
          onPendingReviewClick={() => requestCategorize("workspace")}
        />
        {viewMode === "list" ? (
          <TransactionsTable
            transactions={entityFilteredTransactions}
            dateSortOrder={dateSortOrder}
            onDateSortOrderChange={handleDateSortToggle}
            onStartCategorize={() => requestCategorize("workspace")}
            onSelectTransaction={(row) => setDetailTransactionId(row.id)}
          />
        ) : (
          <CategorizeWorkspace
            transactions={entityFilteredTransactions}
            mains={mains}
            subsByMain={subsByMain}
            entities={entities}
            importBatchId={categorizeBatchId}
            dateSortOrder={dateSortOrder}
            onDateSortOrderChange={handleDateSortToggle}
            onExit={() => {
              setViewMode("list");
              setCategorizeBatchId(null);
            }}
          />
        )}
      </div>

      <CategorizeModePrompt
        open={modePromptOpen}
        pending={modePromptPending}
        aiProgress={aiProgress}
        error={modePromptError}
        transactionCount={pendingForPrompt.length}
        onConfirm={handleConfirmCategorizeMode}
        onCancelAi={handleCancelAiCategorization}
        onClose={() => {
          if (!modePromptPending) {
            setModePromptOpen(false);
            setModePromptBatchId(null);
            setAiProgress(null);
          }
        }}
      />

      {detailTransaction ? (
        <TransactionDetailDialog
          transaction={detailTransaction}
          mains={mains}
          subsByMain={subsByMain}
          entities={entities}
          onClose={() => setDetailTransactionId(null)}
        />
      ) : null}

      {categorizeDialogOpen ? (
        <CategorizeDialog
          transactions={entityFilteredTransactions}
          mains={mains}
          subsByMain={subsByMain}
          entities={entities}
          importBatchId={categorizeBatchId}
          dateSortOrder={dateSortOrder}
          onDateSortOrderChange={handleDateSortToggle}
          onClose={() => {
            setCategorizeDialogOpen(false);
            setCategorizeBatchId(null);
          }}
        />
      ) : null}
    </>
  );
}
