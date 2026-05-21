import type { SubCategorySummary } from "@/lib/categories/types";
import type { TransactionListRow } from "@/lib/transactions/types";

export const DEFAULT_BULK_CONFIRM_MIN_CONFIDENCE = 0.9;

export function isBulkConfirmEligible(
  row: TransactionListRow,
  subsByMain: Record<string, SubCategorySummary[]>,
  minConfidence = DEFAULT_BULK_CONFIRM_MIN_CONFIDENCE,
): boolean {
  if (row.status !== "pending_review") {
    return false;
  }
  if (row.isEmiSplit) {
    return false;
  }
  if (!row.isCategorized) {
    return false;
  }
  if (row.aiConfidence == null || row.aiConfidence < minConfidence) {
    return false;
  }

  if (
    row.mainCategoryId &&
    !row.subCategoryId &&
    (subsByMain[row.mainCategoryId]?.length ?? 0) > 0
  ) {
    return false;
  }

  return true;
}
