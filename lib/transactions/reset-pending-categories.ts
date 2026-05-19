import { prisma } from "@/lib/prisma";

export type ResetPendingCategoriesResult = {
  error?: string;
  success?: boolean;
  resetCount?: number;
};

/** Clears category assignments on pending transactions (manual from scratch). */
export async function resetPendingCategories(input: {
  importBatchId?: string | null;
}): Promise<ResetPendingCategoriesResult> {
  const where: {
    status: "pending_review";
    importBatchId?: string;
  } = { status: "pending_review" };

  if (input.importBatchId) {
    where.importBatchId = input.importBatchId;
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        lines: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { id: true },
        },
      },
    });

    const lineIds = transactions
      .map((t) => t.lines[0]?.id)
      .filter((id): id is string => Boolean(id));

    if (lineIds.length === 0) {
      return { success: true, resetCount: 0 };
    }

    const result = await prisma.transactionLine.updateMany({
      where: { id: { in: lineIds } },
      data: {
        mainCategoryId: null,
        subCategoryId: null,
        confidence: null,
      },
    });

    return { success: true, resetCount: result.count };
  } catch (error) {
    console.error("[resetPendingCategories]", error);
    return { error: "Could not reset categorization." };
  }
}
