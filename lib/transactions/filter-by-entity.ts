import type {
  TransactionListRow,
  TransactionSummary,
  TransactionSummaryBucket,
} from "@/lib/transactions/types";

/** Rows for the selected side-nav entity (includes unassigned lines). */
export function filterTransactionsByEntity(
  rows: TransactionListRow[],
  entityId: string | null,
): TransactionListRow[] {
  if (!entityId) {
    return rows;
  }
  return rows.filter(
    (row) => row.entityId === entityId || row.entityId === null,
  );
}

function bucketFromRows(
  rows: TransactionListRow[],
  status?: TransactionListRow["status"],
): TransactionSummaryBucket {
  const filtered = status
    ? rows.filter((row) => row.status === status)
    : rows;

  return {
    count: filtered.length,
    totalPaise: filtered.reduce((sum, row) => sum + row.amountPaise, 0),
  };
}

export function summaryFromTransactionRows(
  rows: TransactionListRow[],
): TransactionSummary {
  return {
    all: bucketFromRows(rows),
    pendingReview: bucketFromRows(rows, "pending_review"),
    confirmed: bucketFromRows(rows, "confirmed"),
  };
}
