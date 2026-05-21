import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Works even when the dev Prisma singleton is stale (post-migration). */
export async function countLoansFinancingAsset(
  assetAccountId: string,
): Promise<number> {
  const rows = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int AS count
    FROM loans
    WHERE financed_asset_account_id = ${assetAccountId}
  `;
  return rows[0]?.count ?? 0;
}

export type LiabilityFinancingRow = {
  liabilityAccountId: string;
  financedAssetAccountId: string | null;
  financedAssetName: string | null;
};

export async function loadLiabilityFinancingByAccountIds(
  liabilityAccountIds: string[],
): Promise<Map<string, LiabilityFinancingRow>> {
  const map = new Map<string, LiabilityFinancingRow>();
  if (liabilityAccountIds.length === 0) {
    return map;
  }

  const rows = await prisma.$queryRaw<LiabilityFinancingRow[]>`
    SELECT
      l.liability_account_id AS "liabilityAccountId",
      l.financed_asset_account_id AS "financedAssetAccountId",
      a.name AS "financedAssetName"
    FROM loans l
    LEFT JOIN accounts a ON a.id = l.financed_asset_account_id
    WHERE l.liability_account_id IN (${Prisma.join(liabilityAccountIds)})
  `;

  for (const row of rows) {
    map.set(row.liabilityAccountId, row);
  }
  return map;
}

export type AssetFinancingRow = {
  assetAccountId: string;
  loanId: string;
  liabilityAccountId: string;
  liabilityName: string;
  amountFinancedPaise: number;
};

/** Loan header for each financed asset (asset → liability). */
export async function loadLoansFinancingAssets(
  assetAccountIds: string[],
): Promise<Map<string, AssetFinancingRow>> {
  const map = new Map<string, AssetFinancingRow>();
  if (assetAccountIds.length === 0) {
    return map;
  }

  const rows = await prisma.$queryRaw<
    Array<{
      assetAccountId: string;
      loanId: string;
      liabilityAccountId: string;
      liabilityName: string;
      amountFinancedPaise: bigint;
    }>
  >`
    SELECT
      l.financed_asset_account_id AS "assetAccountId",
      l.id AS "loanId",
      l.liability_account_id AS "liabilityAccountId",
      la.name AS "liabilityName",
      l.amount_financed_paise AS "amountFinancedPaise"
    FROM loans l
    INNER JOIN accounts la ON la.id = l.liability_account_id
    WHERE l.financed_asset_account_id IN (${Prisma.join(assetAccountIds)})
  `;

  for (const row of rows) {
    map.set(row.assetAccountId, {
      assetAccountId: row.assetAccountId,
      loanId: row.loanId,
      liabilityAccountId: row.liabilityAccountId,
      liabilityName: row.liabilityName,
      amountFinancedPaise: Number(row.amountFinancedPaise),
    });
  }
  return map;
}

export type AssetDownPaymentTotals = {
  totalPaise: number;
  count: number;
};

/** Sum of transaction lines linked to each asset (down payments). */
export async function loadDownPaymentTotalsByAssetIds(
  assetAccountIds: string[],
): Promise<Map<string, AssetDownPaymentTotals>> {
  const map = new Map<string, AssetDownPaymentTotals>();
  if (assetAccountIds.length === 0) {
    return map;
  }

  const rows = await prisma.transactionLine.groupBy({
    by: ["linkedAccountId"],
    where: {
      linkedAccountId: { in: assetAccountIds },
      linkedAccountType: "asset",
    },
    _sum: { amountPaise: true },
    _count: { id: true },
  });

  for (const row of rows) {
    if (!row.linkedAccountId) {
      continue;
    }
    map.set(row.linkedAccountId, {
      totalPaise: Number(row._sum.amountPaise ?? 0),
      count: row._count.id,
    });
  }
  return map;
}
