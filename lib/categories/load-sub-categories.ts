import type { SubCategorySummary } from "@/lib/categories/types";
import { prisma } from "@/lib/prisma";

export async function loadSubCategoriesByMain(
  mainCategoryId: string,
): Promise<SubCategorySummary[]> {
  const rows = await prisma.subCategory.findMany({
    where: { mainCategoryId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactionLines: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    mainCategoryId: row.mainCategoryId,
    name: row.name,
    description: row.description,
    colorHex: row.colorHex,
    transactionCount: row._count.transactionLines,
  }));
}

export async function loadAllSubCategoriesGrouped(): Promise<
  Record<string, SubCategorySummary[]>
> {
  const rows = await prisma.subCategory.findMany({
    orderBy: [{ mainCategoryId: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { transactionLines: true } },
    },
  });

  const grouped: Record<string, SubCategorySummary[]> = {};
  for (const row of rows) {
    const summary: SubCategorySummary = {
      id: row.id,
      mainCategoryId: row.mainCategoryId,
      name: row.name,
      description: row.description,
      colorHex: row.colorHex,
      transactionCount: row._count.transactionLines,
    };
    if (!grouped[row.mainCategoryId]) {
      grouped[row.mainCategoryId] = [];
    }
    grouped[row.mainCategoryId].push(summary);
  }
  return grouped;
}
