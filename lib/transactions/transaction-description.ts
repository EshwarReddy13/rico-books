import type { TransactionListRow } from "@/lib/transactions/types";

/** User-facing description: line note if set, else bank narration. */
export function transactionDisplayDescription(row: {
  lineDescription: string;
  rawDescription: string;
}): string {
  const line = row.lineDescription.trim();
  if (line) {
    return line;
  }
  const raw = row.rawDescription.trim();
  return raw || "—";
}

export function transactionMatchesSearch(
  row: TransactionListRow,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  const haystack = [
    transactionDisplayDescription(row),
    row.rawDescription,
    row.lineDescription,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
