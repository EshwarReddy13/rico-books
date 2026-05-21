import { syncAssetCostFromFinancing } from "@/lib/accounts/sync-asset-cost-from-financing";
import { verifyScheduleChecksums } from "@/lib/loans/verify-schedule-checksums";
import type { LoanScheduleExtractResult } from "@/lib/loans/types";
import { prisma } from "@/lib/prisma";

export type ScheduleMutationResult = {
  error?: string;
  success?: boolean;
  rowCount?: number;
};

export async function confirmLoanSchedule(
  loanId: string,
  extract: LoanScheduleExtractResult,
  options?: { replaceExisting?: boolean },
): Promise<ScheduleMutationResult> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true, financedAssetAccountId: true },
  });

  if (!loan) {
    return { error: "Loan not found." };
  }

  const matchedCount = await prisma.loanScheduleRow.count({
    where: { loanId, matchedTxnId: { not: null } },
  });

  if (matchedCount > 0 && !options?.replaceExisting) {
    return {
      error:
        "This loan already has matched EMI transactions. Cannot replace the schedule.",
    };
  }

  const checksum = verifyScheduleChecksums(extract);
  if (!checksum.ok) {
    return { error: checksum.errors.join(" ") };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (options?.replaceExisting) {
        const matched = await tx.loanScheduleRow.count({
          where: { loanId, matchedTxnId: { not: null } },
        });
        if (matched > 0) {
          throw new Error("MATCHED_ROWS");
        }
        await tx.loanScheduleRow.deleteMany({ where: { loanId } });
      } else {
        const existing = await tx.loanScheduleRow.count({ where: { loanId } });
        if (existing > 0) {
          throw new Error("EXISTING_SCHEDULE");
        }
      }

      await tx.loan.update({
        where: { id: loanId },
        data: {
          agreementNo: extract.header.agreementNo,
          lender: extract.header.lender,
          loanType: extract.header.loanType,
          amountFinancedPaise: BigInt(extract.header.amountFinancedPaise),
          tenure: extract.header.tenure,
          frequency: extract.header.frequency,
          totalPayablePaise: BigInt(extract.header.totalPayablePaise),
          totalInterestPaise: BigInt(extract.header.totalInterestPaise),
          scheduleGeneratedDate: extract.header.scheduleGeneratedDate
            ? new Date(`${extract.header.scheduleGeneratedDate}T12:00:00`)
            : null,
        },
      });

      await tx.loanScheduleRow.createMany({
        data: extract.rows.map((row) => ({
          loanId,
          installmentNo: row.installmentNo,
          dueDate: new Date(`${row.dueDate}T12:00:00`),
          emiAmountPaise: BigInt(row.emiAmountPaise),
          principalAmountPaise: BigInt(row.principalAmountPaise),
          interestAmountPaise: BigInt(row.interestAmountPaise),
          closingBalancePaise: BigInt(row.closingBalancePaise),
        })),
      });
    });

    if (loan.financedAssetAccountId) {
      await syncAssetCostFromFinancing(loan.financedAssetAccountId);
    }

    return { success: true, rowCount: extract.rows.length };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MATCHED_ROWS") {
        return {
          error:
            "Cannot replace schedule while EMI payments are already matched.",
        };
      }
      if (error.message === "EXISTING_SCHEDULE") {
        return {
          error: "Schedule already exists. Delete it first or use replace mode.",
        };
      }
    }
    console.error("[confirmLoanSchedule]", error);
    return { error: "Could not save schedule." };
  }
}
