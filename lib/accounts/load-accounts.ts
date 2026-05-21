import type { AccountKind, AssetType } from "@/app/generated/prisma/client";
import type {
  AccountCardSummary,
  FinancableAssetOption,
} from "@/lib/accounts/types";
import { computeAssetCostPaise } from "@/lib/accounts/compute-asset-cost";
import {
  loadDownPaymentTotalsByAssetIds,
  loadLoansFinancingAssets,
} from "@/lib/accounts/loan-register-queries";
import { computeLoanOutstandingPaise } from "@/lib/loans/compute-loan-outstanding";
import { prisma } from "@/lib/prisma";

function toSummary(row: {
  id: string;
  name: string;
  assetType: AccountCardSummary["assetType"];
  openingValuePaise: bigint;
  openingDate: Date | null;
  bankProfile?: {
    bankInstitution: NonNullable<AccountCardSummary["bankInstitution"]>;
    accountType: NonNullable<AccountCardSummary["accountType"]>;
  } | null;
}): AccountCardSummary {
  return {
    id: row.id,
    name: row.name,
    assetType: row.assetType,
    openingValuePaise: Number(row.openingValuePaise),
    openingDate: row.openingDate
      ? row.openingDate.toISOString().slice(0, 10)
      : null,
    bankInstitution: row.bankProfile?.bankInstitution ?? null,
    accountType: row.bankProfile?.accountType ?? null,
  };
}

const accountSelect = {
  id: true,
  name: true,
  assetType: true,
  openingValuePaise: true,
  openingDate: true,
  bankProfile: {
    select: {
      bankInstitution: true,
      accountType: true,
    },
  },
} as const;

async function loadByKind(kind: AccountKind): Promise<AccountCardSummary[]> {
  if (kind === "liability") {
    const rows = await prisma.account.findMany({
      where: { accountKind: "liability" },
      orderBy: { name: "asc" },
      select: {
        ...accountSelect,
        loan: {
          select: {
            id: true,
            amountFinancedPaise: true,
            financedAssetAccountId: true,
            financedAssetAccount: { select: { name: true } },
            scheduleRows: {
              select: {
                principalAmountPaise: true,
                matchedTxnId: true,
              },
            },
            _count: { select: { scheduleRows: true } },
          },
        },
      },
    });

    return rows.map((row) => {
      const scheduleRows = row.loan?.scheduleRows ?? [];
      const matchedScheduleCount = scheduleRows.filter(
        (s) => s.matchedTxnId != null,
      ).length;

      const outstandingBalancePaise = row.loan
        ? computeLoanOutstandingPaise({
            amountFinancedPaise: Number(row.loan.amountFinancedPaise),
            openingValuePaise: Number(row.openingValuePaise),
            scheduleRows: scheduleRows.map((s) => ({
              principalAmountPaise: Number(s.principalAmountPaise),
              matchedTxnId: s.matchedTxnId,
            })),
          })
        : undefined;

      return {
        ...toSummary(row),
        hasLoan: row.loan != null,
        loanId: row.loan?.id ?? null,
        financedAssetAccountId: row.loan?.financedAssetAccountId ?? null,
        financedAssetName: row.loan?.financedAssetAccount?.name ?? null,
        scheduleRowCount: row.loan?._count?.scheduleRows ?? 0,
        matchedScheduleCount,
        outstandingBalancePaise,
      };
    });
  }

  const rows = await prisma.account.findMany({
    where: { accountKind: kind },
    orderBy: { name: "asc" },
    select: accountSelect,
  });

  return rows.map(toSummary);
}

export async function loadAssets(): Promise<AccountCardSummary[]> {
  const rows = await prisma.account.findMany({
    where: { accountKind: "asset" },
    orderBy: { name: "asc" },
    select: accountSelect,
  });

  const nonBankIds = rows
    .filter((r) => r.assetType && r.assetType !== "bank")
    .map((r) => r.id);

  const [loansByAsset, downPaymentsByAsset] = await Promise.all([
    loadLoansFinancingAssets(nonBankIds),
    loadDownPaymentTotalsByAssetIds(nonBankIds),
  ]);

  return rows.map((row) => {
    const summary = toSummary(row);
    if (!row.assetType || row.assetType === "bank") {
      return summary;
    }

    const financing = loansByAsset.get(row.id);
    const downPayments = downPaymentsByAsset.get(row.id);
    const downPaymentTotalPaise = downPayments?.totalPaise ?? 0;
    const amountFinancedPaise = financing?.amountFinancedPaise ?? null;

    const { costPaise, isComputed } = computeAssetCostPaise({
      amountFinancedPaise,
      downPaymentTotalPaise,
      openingValuePaise: Number(row.openingValuePaise),
    });

    return {
      ...summary,
      linkedLoanId: financing?.loanId ?? null,
      linkedLoanName: financing?.liabilityName ?? null,
      linkedLiabilityAccountId: financing?.liabilityAccountId ?? null,
      amountFinancedPaise,
      downPaymentTotalPaise,
      downPaymentCount: downPayments?.count ?? 0,
      computedCostPaise: costPaise,
      costIsComputed: isComputed,
    };
  });
}

export async function loadBankAccounts(): Promise<AccountCardSummary[]> {
  const rows = await prisma.account.findMany({
    where: { accountKind: "asset", assetType: "bank" },
    orderBy: { name: "asc" },
    select: accountSelect,
  });

  return rows.map(toSummary);
}

export async function loadLiabilities(): Promise<AccountCardSummary[]> {
  return loadByKind("liability");
}

export async function loadFinancableAssets(): Promise<FinancableAssetOption[]> {
  const rows = await prisma.account.findMany({
    where: {
      accountKind: "asset",
      assetType: { not: "bank" },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, assetType: true },
  });

  return rows
    .filter((r): r is typeof r & { assetType: AssetType } => r.assetType != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      assetType: r.assetType,
    }));
}
