import type { Prisma } from "@/app/generated/prisma/client";
import { computeAssetCostPaise } from "@/lib/accounts/compute-asset-cost";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

// Financed vehicle cost sync — see docs/flow-financed-vehicle.md

/**
 * Persist computed asset cost (down payments + loan financed) to opening_value_paise
 * and opening_date on the account row.
 *
 * Call only from explicit events — never on page load:
 * - Loan saved/linked to a financed asset (`upsertLoanForLiability`)
 * - Loan schedule confirmed (updates amount financed / schedule date)
 * - Down payment categorized to Assets → {asset} (`saveTransactionCategorization`)
 * - Asset register created (no-op until loan/down payment exist)
 */
export async function syncAssetCostFromFinancing(
  assetAccountId: string,
  tx?: Tx,
): Promise<{ synced: boolean }> {
  const db = tx ?? prisma;

  const asset = await db.account.findFirst({
    where: {
      id: assetAccountId,
      accountKind: "asset",
      assetType: { not: "bank" },
    },
    select: {
      id: true,
      openingValuePaise: true,
      openingDate: true,
    },
  });

  if (!asset) {
    return { synced: false };
  }

  const loan = await db.loan.findFirst({
    where: { financedAssetAccountId: assetAccountId },
    select: {
      amountFinancedPaise: true,
      scheduleGeneratedDate: true,
      scheduleRows: {
        orderBy: { installmentNo: "asc" },
        take: 1,
        select: { dueDate: true },
      },
    },
  });

  const downAgg = await db.transactionLine.aggregate({
    where: {
      linkedAccountId: assetAccountId,
      linkedAccountType: "asset",
    },
    _sum: { amountPaise: true },
  });

  const downPaymentTotalPaise = Number(downAgg._sum.amountPaise ?? 0);
  const amountFinancedPaise = loan ? Number(loan.amountFinancedPaise) : null;

  const { costPaise, isComputed } = computeAssetCostPaise({
    amountFinancedPaise,
    downPaymentTotalPaise,
    openingValuePaise: Number(asset.openingValuePaise),
  });

  if (!isComputed) {
    return { synced: false };
  }

  const openingDate = await resolveAssetCostAsOfDate(assetAccountId, db);
  const openingValuePaise = BigInt(costPaise);

  const prevDate = asset.openingDate?.getTime() ?? null;
  const nextDate = openingDate?.getTime() ?? null;
  if (
    asset.openingValuePaise === openingValuePaise &&
    prevDate === nextDate
  ) {
    return { synced: false };
  }

  await db.account.update({
    where: { id: assetAccountId },
    data: {
      openingValuePaise,
      openingDate,
    },
  });

  return { synced: true };
}

async function resolveAssetCostAsOfDate(
  assetAccountId: string,
  db: Tx | typeof prisma,
): Promise<Date | null> {
  const earliestDown = await db.transactionLine.findFirst({
    where: {
      linkedAccountId: assetAccountId,
      linkedAccountType: "asset",
    },
    orderBy: { transaction: { date: "asc" } },
    select: { transaction: { select: { date: true } } },
  });

  if (earliestDown) {
    return earliestDown.transaction.date;
  }

  const loan = await db.loan.findFirst({
    where: { financedAssetAccountId: assetAccountId },
    select: {
      scheduleGeneratedDate: true,
      scheduleRows: {
        orderBy: { installmentNo: "asc" },
        take: 1,
        select: { dueDate: true },
      },
    },
  });

  if (loan?.scheduleGeneratedDate) {
    return loan.scheduleGeneratedDate;
  }

  return loan?.scheduleRows[0]?.dueDate ?? null;
}

/** Re-sync previous asset when loan is re-linked to a different vehicle. */
export async function syncAssetCostAfterLoanLinkChange(
  previousFinancedAssetId: string | null | undefined,
  newFinancedAssetId: string | null | undefined,
): Promise<void> {
  if (
    previousFinancedAssetId &&
    previousFinancedAssetId !== newFinancedAssetId
  ) {
    await syncAssetCostFromFinancing(previousFinancedAssetId);
  }
  if (newFinancedAssetId) {
    await syncAssetCostFromFinancing(newFinancedAssetId);
  }
}
