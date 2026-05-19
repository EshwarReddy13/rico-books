/** Transactions per Gemini request — keeps batches fast and progress granular. */
export const AI_CATEGORIZE_BATCH_SIZE = 8;

export type AiCategorizeProgress = {
  percent: number;
  completed: number;
  total: number;
  label: string;
};

/** Maps completed transaction count to bar % (only advances when batches finish). */
export function percentFromCompleted(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  if (completed >= total) {
    return 100;
  }
  if (completed === 0) {
    return 3;
  }
  return Math.min(99, Math.round((completed / total) * 100));
}

export function buildInitialAiProgress(totalTransactions: number): AiCategorizeProgress {
  return {
    percent: 0,
    completed: 0,
    total: totalTransactions,
    label: "Preparing your categories and transactions…",
  };
}
