import { resolveLoanInterestSubCategoryId } from "@/lib/categories/resolve-main-category";
import { rewriteMatchedEmiLines } from "@/lib/loans/match-emi-on-import";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

type Tx = Prisma.TransactionClient;

function linesMatchSchedule(
  lines: Array<{
    amountPaise: bigint;
    subCategoryId: string | null;
    linkedAccountId: string | null;
  }>,
  interestSubId: string,
  loanSubId: string,
  liabilityAccountId: string,
  interestPaise: bigint,
  principalPaise: bigint,
): boolean {
  if (lines.length !== 2) {
    return false;
  }

  const hasInterest = lines.some(
    (l) =>
      l.amountPaise === interestPaise &&
      l.subCategoryId === interestSubId &&
      l.linkedAccountId == null,
  );
  const hasPrincipal = lines.some(
    (l) =>
      l.amountPaise === principalPaise &&
      l.subCategoryId === loanSubId &&
      l.linkedAccountId === liabilityAccountId,
  );

  return hasInterest && hasPrincipal;
}

/** Fix EMI splits corrupted by AI (which only updated the first line). Idempotent. */
export async function repairEmiSplitLines(
  tx?: Tx,
): Promise<{ repaired: number }> {
  const db = tx ?? prisma;
  const interestSubId = await resolveLoanInterestSubCategoryId();
  if (!interestSubId) {
    return { repaired: 0 };
  }

  const scheduleRows = await db.loanScheduleRow.findMany({
    where: { matchedTxnId: { not: null } },
    select: {
      interestAmountPaise: true,
      principalAmountPaise: true,
      matchedTxnId: true,
      loan: {
        select: {
          liabilityAccountId: true,
        },
      },
    },
  });

  let repaired = 0;

  for (const row of scheduleRows) {
    const txnId = row.matchedTxnId;
    if (!txnId) {
      continue;
    }

    const loanSub = await db.subCategory.findFirst({
      where: {
        linkedRecordId: row.loan.liabilityAccountId,
        linkedRecordType: "liability",
      },
      select: { id: true },
    });
    if (!loanSub) {
      continue;
    }

    const txn = await db.transaction.findUnique({
      where: { id: txnId },
      select: {
        id: true,
        rawDescription: true,
        lines: {
          orderBy: { createdAt: "asc" },
          select: {
            amountPaise: true,
            subCategoryId: true,
            linkedAccountId: true,
          },
        },
      },
    });

    if (!txn) {
      continue;
    }

    if (
      linesMatchSchedule(
        txn.lines,
        interestSubId,
        loanSub.id,
        row.loan.liabilityAccountId,
        row.interestAmountPaise,
        row.principalAmountPaise,
      )
    ) {
      continue;
    }

    await rewriteMatchedEmiLines(db, {
      transactionId: txn.id,
      rawDescription: txn.rawDescription,
      interestSubId,
      loanSubId: loanSub.id,
      liabilityAccountId: row.loan.liabilityAccountId,
      interestPaise: row.interestAmountPaise,
      principalPaise: row.principalAmountPaise,
    });

    repaired += 1;
  }

  return { repaired };
}
