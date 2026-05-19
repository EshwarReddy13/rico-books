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
import { TransactionsTable } from "@/components/transactions/transactions-table";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import type { EntitySummary } from "@/lib/entities/types";
import { buildInitialAiProgress } from "@/lib/transactions/ai-categorize-progress";
import type { AiCategorizeProgress } from "@/lib/transactions/ai-categorize-progress";
import { apiResetPendingCategorization } from "@/lib/transactions/categorize-api";
import { runAiCategorizeBatched } from "@/lib/transactions/run-ai-categorize-batched";
import {
  toggleDateSortOrder,
  type DateSortOrder,
} from "@/lib/transactions/sort-transactions";
import type {
  TransactionListRow,
  TransactionSummary,
} from "@/lib/transactions/types";

type ViewMode = "list" | "categorize";
type CategorizeTarget = "workspace" | "dialog";

export function TransactionsClient({
  transactions,
  summary,
  mains,
  subsByMain,
  entities,
}: {
  transactions: TransactionListRow[];
  summary: TransactionSummary;
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

  function handleDateSortToggle() {
    setDateSortOrder((prev) => toggleDateSortOrder(prev));
  }

  const pendingForPrompt = useMemo(() => {
    let rows = transactions.filter((t) => t.status === "pending_review");
    if (modePromptBatchId) {
      rows = rows.filter((t) => t.importBatchId === modePromptBatchId);
    }
    return rows;
  }, [transactions, modePromptBatchId]);

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
        <TransactionsActions
          onCategorizeDialogOpen={() => requestCategorize("dialog")}
        />
        <TransactionsSummaryCards
          summary={summary}
          onPendingReviewClick={() => requestCategorize("workspace")}
        />
        {viewMode === "list" ? (
          <TransactionsTable
            transactions={transactions}
            dateSortOrder={dateSortOrder}
            onDateSortOrderChange={handleDateSortToggle}
            onStartCategorize={() => requestCategorize("workspace")}
          />
        ) : (
          <CategorizeWorkspace
            transactions={transactions}
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

      {categorizeDialogOpen ? (
        <CategorizeDialog
          transactions={transactions}
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
