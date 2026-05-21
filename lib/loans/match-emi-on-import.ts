import { resolveLoanInterestSubCategoryId } from "@/lib/categories/resolve-main-category";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

/** Days before/after due date to match an EMI debit. */
export const EMI_DATE_TOLERANCE_DAYS = 10;

type TxClient = Prisma.TransactionClient;

/** Shared with repair-emi-split-lines — interest line first, principal second. */
export async function rewriteMatchedEmiLines(
  tx: TxClient,
  input: {
    transactionId: string;
    rawDescription: string;
    interestSubId: string;
    loanSubId: string;
    liabilityAccountId: string;
    interestPaise: bigint;
    principalPaise: bigint;
  },
): Promise<void> {
  await tx.transactionLine.deleteMany({
    where: { transactionId: input.transactionId },
  });

  await tx.transactionLine.createMany({
    data: [
      {
        transactionId: input.transactionId,
        amountPaise: input.interestPaise,
        subCategoryId: input.interestSubId,
        description: input.rawDescription,
        linkedAccountId: null,
        linkedAccountType: null,
      },
      {
        transactionId: input.transactionId,
        amountPaise: input.principalPaise,
        subCategoryId: input.loanSubId,
        description: input.rawDescription,
        linkedAccountId: input.liabilityAccountId,
        linkedAccountType: "liability",
      },
    ],
  });
}

type OpenScheduleRow = {
  id: string;
  loanId: string;
  emiAmountPaise: bigint;
  principalAmountPaise: bigint;
  interestAmountPaise: bigint;
  dueDate: Date;
  liabilityAccountId: string;
  loanSubCategoryId: string;
};

async function loadOpenScheduleRows(
  tx: TxClient,
): Promise<OpenScheduleRow[]> {
  const rows = await tx.loanScheduleRow.findMany({
    where: { matchedTxnId: null },
    orderBy: [{ dueDate: "asc" }, { installmentNo: "asc" }],
    include: {
      loan: {
        select: {
          liabilityAccountId: true,
          liabilityAccount: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const result: OpenScheduleRow[] = [];

  for (const row of rows) {
    const sub = await tx.subCategory.findFirst({
      where: {
        linkedRecordId: row.loan.liabilityAccountId,
        linkedRecordType: "liability",
      },
      select: { id: true },
    });
    if (!sub) {
      continue;
    }
    result.push({
      id: row.id,
      loanId: row.loanId,
      emiAmountPaise: row.emiAmountPaise,
      principalAmountPaise: row.principalAmountPaise,
      interestAmountPaise: row.interestAmountPaise,
      dueDate: row.dueDate,
      liabilityAccountId: row.loan.liabilityAccountId,
      loanSubCategoryId: sub.id,
    });
  }

  return result;
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function findMatchingRow(
  txnDate: Date,
  amountPaise: bigint,
  direction: string,
  openRows: OpenScheduleRow[],
): OpenScheduleRow | null {
  if (direction !== "debit") {
    return null;
  }

  for (const row of openRows) {
    if (row.emiAmountPaise !== amountPaise) {
      continue;
    }
    if (daysBetween(txnDate, row.dueDate) <= EMI_DATE_TOLERANCE_DAYS) {
      return row;
    }
  }

  return null;
}

/**
 * Match imported debits to loan schedule rows and pre-split into interest + principal lines.
 * Call inside the import transaction after transactions are created.
 */
export async function matchEmiTransactionsOnImport(
  tx: TxClient,
  transactionIds: string[],
): Promise<number> {
  if (transactionIds.length === 0) {
    return 0;
  }

  const interestSubId = await resolveLoanInterestSubCategoryId();
  if (!interestSubId) {
    return 0;
  }

  const openRows = await loadOpenScheduleRows(tx);
  if (openRows.length === 0) {
    return 0;
  }

  const transactions = await tx.transaction.findMany({
    where: { id: { in: transactionIds } },
    select: {
      id: true,
      date: true,
      amountPaise: true,
      direction: true,
      rawDescription: true,
      lines: { select: { id: true } },
    },
  });

  let matched = 0;

  for (const txn of transactions) {
    const scheduleRow = findMatchingRow(
      txn.date,
      txn.amountPaise,
      txn.direction,
      openRows,
    );
    if (!scheduleRow) {
      continue;
    }

    const openIndex = openRows.findIndex((r) => r.id === scheduleRow.id);
    if (openIndex >= 0) {
      openRows.splice(openIndex, 1);
    }

    await rewriteMatchedEmiLines(tx, {
      transactionId: txn.id,
      rawDescription: txn.rawDescription,
      interestSubId,
      loanSubId: scheduleRow.loanSubCategoryId,
      liabilityAccountId: scheduleRow.liabilityAccountId,
      interestPaise: scheduleRow.interestAmountPaise,
      principalPaise: scheduleRow.principalAmountPaise,
    });

    await tx.loanScheduleRow.update({
      where: { id: scheduleRow.id },
      data: { matchedTxnId: txn.id },
    });

    matched += 1;
  }

  return matched;
}
