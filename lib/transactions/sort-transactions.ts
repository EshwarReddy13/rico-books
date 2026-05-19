import type { TransactionListRow } from "@/lib/transactions/types";

export type DateSortOrder = "desc" | "asc";

/** Sort by ISO date (`date` field), then id for a stable order. */
export function sortTransactionsByDate(
  rows: TransactionListRow[],
  order: DateSortOrder,
  options?: { uncategorizedFirst?: boolean },
): TransactionListRow[] {
  const dateMult = order === "desc" ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (options?.uncategorizedFirst && a.isCategorized !== b.isCategorized) {
      return a.isCategorized ? 1 : -1;
    }

    const byDate = a.date.localeCompare(b.date) * dateMult;
    if (byDate !== 0) {
      return byDate;
    }

    return a.id.localeCompare(b.id) * dateMult;
  });
}

export function toggleDateSortOrder(order: DateSortOrder): DateSortOrder {
  return order === "desc" ? "asc" : "desc";
}

export function dateSortLabel(order: DateSortOrder): string {
  return order === "desc" ? "Newest first" : "Oldest first";
}
