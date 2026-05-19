import {
  AI_CATEGORIZE_BATCH_SIZE,
  buildInitialAiProgress,
  percentFromCompleted,
  type AiCategorizeProgress,
} from "@/lib/transactions/ai-categorize-progress";
import { apiRunAiCategorization } from "@/lib/transactions/categorize-api";

export type RunAiCategorizeBatchedResult = {
  success?: boolean;
  cancelled?: boolean;
  error?: string;
  categorizedCount?: number;
  skippedCount?: number;
};

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

export async function runAiCategorizeBatched(input: {
  importBatchId?: string | null;
  transactionIds: string[];
  onProgress: (progress: AiCategorizeProgress) => void;
  signal?: AbortSignal;
}): Promise<RunAiCategorizeBatchedResult> {
  const { transactionIds, importBatchId, onProgress, signal } = input;
  const total = transactionIds.length;

  if (total === 0) {
    return { error: "No pending transactions to categorize." };
  }

  try {
    onProgress(buildInitialAiProgress(total));

    const batchCount = Math.ceil(total / AI_CATEGORIZE_BATCH_SIZE);
    let completed = 0;
    let categorizedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < total; i += AI_CATEGORIZE_BATCH_SIZE) {
      throwIfAborted(signal);

      const chunk = transactionIds.slice(i, i + AI_CATEGORIZE_BATCH_SIZE);
      const batchIndex = Math.floor(i / AI_CATEGORIZE_BATCH_SIZE) + 1;
      const isLastBatch = batchIndex === batchCount;

      const result = await apiRunAiCategorization({
        importBatchId,
        transactionIds: chunk,
        revalidate: isLastBatch,
        signal,
      });

      throwIfAborted(signal);

      if (result.error) {
        return { error: result.error };
      }

      completed += chunk.length;
      categorizedCount += result.categorizedCount ?? 0;
      skippedCount += result.skippedCount ?? 0;

      onProgress({
        percent: percentFromCompleted(completed, total),
        completed,
        total,
        label:
          completed >= total
            ? "Done!"
            : batchCount === 1
              ? `${completed} of ${total} transactions categorized`
              : `Batch ${batchIndex} of ${batchCount} done · ${completed}/${total}`,
      });
    }

    throwIfAborted(signal);

    if (categorizedCount === 0) {
      return {
        error:
          "AI could not apply any categorizations. Try again or categorize manually.",
      };
    }

    return { success: true, categorizedCount, skippedCount };
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return { cancelled: true };
    }
    throw error;
  }
}
