import type { SubCategorySummary } from "@/lib/categories/types";
import { prisma } from "@/lib/prisma";

export async function loadSubCategoriesByMain(
  mainCategoryId: string,
): Promise<SubCategorySummary[]> {
  const rows = await prisma.subCategory.findMany({
    where: { mainCategoryId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      mainCategoryId: true,
      name: true,
      description: true,
      colorHex: true,
      linkedRecordId: true,
      linkedRecordType: true,
      _count: { select: { transactionLines: true } },
    },
  });

  return mapSubCategoryRows(rows);
}

export async function loadAllSubCategoriesGrouped(): Promise<
  Record<string, SubCategorySummary[]>
> {
  const rows = await prisma.subCategory.findMany({
    orderBy: [{ mainCategoryId: "asc" }, { name: "asc" }],
    select: {
      id: true,
      mainCategoryId: true,
      name: true,
      description: true,
      colorHex: true,
      linkedRecordId: true,
      linkedRecordType: true,
      _count: { select: { transactionLines: true } },
    },
  });

  const summaries = await mapSubCategoryRows(rows);
  const grouped: Record<string, SubCategorySummary[]> = {};
  for (const summary of summaries) {
    if (!grouped[summary.mainCategoryId]) {
      grouped[summary.mainCategoryId] = [];
    }
    grouped[summary.mainCategoryId].push(summary);
  }
  return grouped;
}

type SubRow = {
  id: string;
  mainCategoryId: string;
  name: string;
  description: string;
  colorHex: string;
  linkedRecordId: string | null;
  linkedRecordType: "asset" | "liability" | null;
  _count: { transactionLines: number };
};

async function mapSubCategoryRows(rows: SubRow[]): Promise<SubCategorySummary[]> {
  const linkedIds = [
    ...new Set(
      rows
        .map((r) => r.linkedRecordId)
        .filter((id): id is string => id != null),
    ),
  ];

  const accounts =
    linkedIds.length > 0
      ? await prisma.account.findMany({
          where: { id: { in: linkedIds } },
          select: { id: true, name: true },
        })
      : [];
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

  return rows.map((row) => ({
    id: row.id,
    mainCategoryId: row.mainCategoryId,
    name: row.name,
    description: row.description,
    colorHex: row.colorHex,
    transactionCount: row._count.transactionLines,
    linkedRecordId: row.linkedRecordId,
    linkedRecordType: row.linkedRecordType,
    linkedAccountName: row.linkedRecordId
      ? (accountNameById.get(row.linkedRecordId) ?? null)
      : null,
  }));
}
