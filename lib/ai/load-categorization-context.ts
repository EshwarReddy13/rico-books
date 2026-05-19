import { loadAllSubCategoriesGrouped } from "@/lib/categories/load-sub-categories";
import { loadMainCategories } from "@/lib/categories/load-main-categories";
import { loadEntities } from "@/lib/entities/load-entities";
import { prisma } from "@/lib/prisma";

export async function loadCategorizationContext() {
  const [mains, subsByMain, entities] = await Promise.all([
    loadMainCategories(),
    loadAllSubCategoriesGrouped(),
    loadEntities(),
  ]);

  const mainsForAi = mains.filter((m) => !m.id.startsWith("placeholder-"));

  return { mains: mainsForAi, subsByMain, entities };
}

export async function loadTransactionsForAiCategorization(filters: {
  importBatchId?: string | null;
  transactionIds?: string[];
}) {
  const where: {
    status: "pending_review";
    importBatchId?: string;
    id?: { in: string[] };
  } = { status: "pending_review" };

  if (filters.importBatchId) {
    where.importBatchId = filters.importBatchId;
  }
  if (filters.transactionIds && filters.transactionIds.length > 0) {
    where.id = { in: filters.transactionIds };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      sourceAccount: { select: { name: true } },
      lines: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          entityId: true,
          mainCategoryId: true,
          subCategoryId: true,
        },
      },
    },
  });
}
