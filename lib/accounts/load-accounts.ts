import type { AccountKind } from "@/app/generated/prisma/client";
import {
  PLACEHOLDER_ASSETS,
  PLACEHOLDER_LIABILITIES,
} from "@/lib/accounts/placeholder-accounts";
import type { AccountCardSummary } from "@/lib/accounts/types";
import { prisma } from "@/lib/prisma";

function toSummary(row: {
  id: string;
  name: string;
  assetType: AccountCardSummary["assetType"];
  openingValuePaise: bigint;
  openingDate: Date | null;
}): AccountCardSummary {
  return {
    id: row.id,
    name: row.name,
    assetType: row.assetType,
    openingValuePaise: Number(row.openingValuePaise),
    openingDate: row.openingDate
      ? row.openingDate.toISOString().slice(0, 10)
      : null,
  };
}

async function loadByKind(kind: AccountKind): Promise<AccountCardSummary[]> {
  const rows = await prisma.account.findMany({
    where: { accountKind: kind },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      assetType: true,
      openingValuePaise: true,
      openingDate: true,
    },
  });

  return rows.map(toSummary);
}

export async function loadAssets(): Promise<AccountCardSummary[]> {
  const accounts = await loadByKind("asset");
  return accounts.length > 0 ? accounts : PLACEHOLDER_ASSETS;
}

export async function loadLiabilities(): Promise<AccountCardSummary[]> {
  const accounts = await loadByKind("liability");
  return accounts.length > 0 ? accounts : PLACEHOLDER_LIABILITIES;
}
