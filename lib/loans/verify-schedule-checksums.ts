import type { LoanScheduleExtractResult, ScheduleChecksumResult } from "@/lib/loans/types";

export function verifyScheduleChecksums(
  extract: LoanScheduleExtractResult,
): ScheduleChecksumResult {
  const errors: string[] = [];
  const { header, rows } = extract;

  if (rows.length === 0) {
    errors.push("Schedule has no instalment rows.");
    return { ok: false, errors };
  }

  let sumPrincipal = 0;
  let sumInterest = 0;
  let sumEmi = 0;

  for (const row of rows) {
    sumPrincipal += row.principalAmountPaise;
    sumInterest += row.interestAmountPaise;
    sumEmi += row.emiAmountPaise;

    if (row.emiAmountPaise !== row.principalAmountPaise + row.interestAmountPaise) {
      errors.push(
        `Instalment ${row.installmentNo}: EMI does not equal principal + interest.`,
      );
    }
  }

  if (sumPrincipal !== header.amountFinancedPaise) {
    errors.push(
      `Sum of principal (₹${(sumPrincipal / 100).toLocaleString("en-IN")}) does not match amount financed (₹${(header.amountFinancedPaise / 100).toLocaleString("en-IN")}).`,
    );
  }

  if (sumInterest !== header.totalInterestPaise) {
    errors.push(
      `Sum of interest does not match loan header total interest.`,
    );
  }

  if (sumEmi !== header.totalPayablePaise) {
    errors.push(`Sum of EMI amounts does not match total payable.`);
  }

  if (rows.length !== header.tenure) {
    errors.push(
      `Row count (${rows.length}) does not match tenure (${header.tenure}).`,
    );
  }

  return { ok: errors.length === 0, errors };
}
