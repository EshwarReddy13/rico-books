import type { SchedulePaymentStatus } from "@/lib/loans/types";

export function schedulePaymentStatus(row: {
  matchedTxnId: string | null;
  matchedTransaction?: { status: string } | null;
}): SchedulePaymentStatus {
  if (!row.matchedTxnId) {
    return "due";
  }
  if (row.matchedTransaction?.status === "confirmed") {
    return "paid";
  }
  return "pending";
}

/**
 * Outstanding principal = amount financed − sum(principal on linked instalments).
 * Falls back to liability opening balance when financed amount is unset.
 */
export function computeLoanOutstandingPaise(input: {
  amountFinancedPaise: number;
  openingValuePaise: number;
  scheduleRows: Array<{
    principalAmountPaise: number;
    matchedTxnId: string | null;
  }>;
}): number {
  const base =
    input.amountFinancedPaise > 0
      ? input.amountFinancedPaise
      : input.openingValuePaise;

  const principalPaid = input.scheduleRows
    .filter((r) => r.matchedTxnId != null)
    .reduce((sum, r) => sum + r.principalAmountPaise, 0);

  return Math.max(0, base - principalPaid);
}
