import type { AssetDownPaymentsView } from "@/lib/accounts/types";
import { prisma } from "@/lib/prisma";

function formatLineCategory(line: {
  mainCategory: { name: string } | null;
  subCategory: { name: string } | null;
}): string {
  if (line.subCategory?.name) {
    return line.mainCategory?.name
      ? `${line.mainCategory.name} → ${line.subCategory.name}`
      : line.subCategory.name;
  }
  return line.mainCategory?.name ?? "Uncategorized";
}

export async function loadAssetDownPaymentsView(
  assetAccountId: string,
): Promise<AssetDownPaymentsView | { error: string }> {
  const asset = await prisma.account.findFirst({
    where: {
      id: assetAccountId,
      accountKind: "asset",
      assetType: { not: "bank" },
    },
    select: { id: true, name: true },
  });

  if (!asset) {
    return { error: "Asset not found." };
  }

  const lines = await prisma.transactionLine.findMany({
    where: {
      linkedAccountId: assetAccountId,
      linkedAccountType: "asset",
    },
    orderBy: { transaction: { date: "desc" } },
    select: {
      id: true,
      amountPaise: true,
      description: true,
      transaction: {
        select: {
          id: true,
          date: true,
          status: true,
          rawDescription: true,
        },
      },
      mainCategory: { select: { name: true } },
      subCategory: { select: { name: true } },
    },
  });

  const rows = lines.map((line) => ({
    lineId: line.id,
    transactionId: line.transaction.id,
    date: line.transaction.date.toISOString().slice(0, 10),
    amountPaise: Number(line.amountPaise),
    description:
      line.description.trim() || line.transaction.rawDescription || "—",
    status: line.transaction.status as "pending_review" | "confirmed",
    categoryName: formatLineCategory(line),
  }));

  const totalPaise = rows.reduce((sum, r) => sum + r.amountPaise, 0);

  return {
    assetAccountId: asset.id,
    assetName: asset.name,
    rows,
    totalPaise,
    count: rows.length,
  };
}
