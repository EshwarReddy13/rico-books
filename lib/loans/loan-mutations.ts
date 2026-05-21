import {
  syncAssetCostAfterLoanLinkChange,
} from "@/lib/accounts/sync-asset-cost-from-financing";
import { parseLoanInput, type LoanInput } from "@/lib/loans/parse-loan-input";
import type { LoanSummary } from "@/lib/loans/types";
import { prisma } from "@/lib/prisma";

export type LoanMutationResult = {
  error?: string;
  success?: boolean;
  loan?: LoanSummary;
};

function toLoanSummary(row: {
  id: string;
  liabilityAccountId: string;
  financedAssetAccountId: string | null;
  agreementNo: string;
  lender: string;
  loanType: string;
  amountFinancedPaise: bigint;
  tenure: number;
  frequency: string;
  totalPayablePaise: bigint;
  totalInterestPaise: bigint;
  scheduleGeneratedDate: Date | null;
  _count: { scheduleRows: number };
  scheduleRows?: { matchedTxnId: string | null }[];
}): LoanSummary {
  const matchedScheduleCount =
    row.scheduleRows?.filter((r) => r.matchedTxnId != null).length ?? 0;

  return {
    id: row.id,
    liabilityAccountId: row.liabilityAccountId,
    financedAssetAccountId: row.financedAssetAccountId,
    agreementNo: row.agreementNo,
    lender: row.lender,
    loanType: row.loanType,
    amountFinancedPaise: Number(row.amountFinancedPaise),
    tenure: row.tenure,
    frequency: row.frequency,
    totalPayablePaise: Number(row.totalPayablePaise),
    totalInterestPaise: Number(row.totalInterestPaise),
    scheduleGeneratedDate: row.scheduleGeneratedDate
      ? row.scheduleGeneratedDate.toISOString().slice(0, 10)
      : null,
    scheduleRowCount: row._count.scheduleRows,
    matchedScheduleCount,
  };
}

export async function loadLoanByLiabilityAccountId(
  liabilityAccountId: string,
): Promise<LoanSummary | null> {
  const row = await prisma.loan.findUnique({
    where: { liabilityAccountId },
    include: {
      _count: { select: { scheduleRows: true } },
      scheduleRows: { select: { matchedTxnId: true } },
    },
  });

  if (!row) {
    return null;
  }

  return toLoanSummary(row);
}

export async function upsertLoanForLiability(
  liabilityAccountId: string,
  input: LoanInput,
): Promise<LoanMutationResult> {
  const liability = await prisma.account.findFirst({
    where: { id: liabilityAccountId, accountKind: "liability" },
    select: { id: true },
  });

  if (!liability) {
    return { error: "Liability account not found." };
  }

  const parsed = parseLoanInput(input);
  if ("error" in parsed) {
    return parsed;
  }

  if (parsed.financedAssetAccountId) {
    const asset = await prisma.account.findFirst({
      where: {
        id: parsed.financedAssetAccountId,
        accountKind: "asset",
        assetType: { not: "bank" },
      },
    });
    if (!asset) {
      return { error: "Financed asset not found." };
    }
  }

  const previous = await prisma.loan.findUnique({
    where: { liabilityAccountId },
    select: { financedAssetAccountId: true },
  });

  try {
    const row = await prisma.loan.upsert({
      where: { liabilityAccountId },
      create: {
        liabilityAccountId,
        agreementNo: parsed.agreementNo,
        lender: parsed.lender,
        loanType: parsed.loanType,
        amountFinancedPaise: parsed.amountFinancedPaise,
        tenure: parsed.tenure,
        frequency: parsed.frequency,
        totalPayablePaise: parsed.totalPayablePaise,
        totalInterestPaise: parsed.totalInterestPaise,
        scheduleGeneratedDate: parsed.scheduleGeneratedDate,
        financedAssetAccountId: parsed.financedAssetAccountId,
      },
      update: {
        agreementNo: parsed.agreementNo,
        lender: parsed.lender,
        loanType: parsed.loanType,
        amountFinancedPaise: parsed.amountFinancedPaise,
        tenure: parsed.tenure,
        frequency: parsed.frequency,
        totalPayablePaise: parsed.totalPayablePaise,
        totalInterestPaise: parsed.totalInterestPaise,
        scheduleGeneratedDate: parsed.scheduleGeneratedDate,
        financedAssetAccountId: parsed.financedAssetAccountId,
      },
      include: {
        _count: { select: { scheduleRows: true } },
        scheduleRows: { select: { matchedTxnId: true } },
      },
    });

    await syncAssetCostAfterLoanLinkChange(
      previous?.financedAssetAccountId,
      parsed.financedAssetAccountId,
    );

    return { success: true, loan: toLoanSummary(row) };
  } catch (error) {
    console.error("[upsertLoanForLiability]", error);
    return { error: "Could not save loan details." };
  }
}
