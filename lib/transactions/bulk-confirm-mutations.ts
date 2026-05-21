import { DEFAULT_BULK_CONFIRM_MIN_CONFIDENCE } from "@/lib/transactions/bulk-confirm-eligible";
import { validateLineCategoryAssignment } from "@/lib/transactions/line-category";
import { saveTransactionCategorization } from "@/lib/transactions/categorize-mutations";
import { prisma } from "@/lib/prisma";

export type BulkConfirmResult = {
  error?: string;
  success?: boolean;
  confirmedCount?: number;
  skippedCount?: number;
};

export async function bulkConfirmHighConfidence(input: {
  transactionIds: string[];
  minConfidence?: number;
  entityId?: string | null;
}): Promise<BulkConfirmResult> {
  const minConfidence =
    input.minConfidence ?? DEFAULT_BULK_CONFIRM_MIN_CONFIDENCE;
  const entityId = input.entityId?.trim() || null;

  if (input.transactionIds.length === 0) {
    return { error: "No transactions selected." };
  }

  try {
    const rows = await prisma.transaction.findMany({
      where: {
        id: { in: input.transactionIds },
        status: "pending_review",
      },
      include: {
        lines: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: {
            mainCategoryId: true,
            subCategoryId: true,
            entityId: true,
            description: true,
            confidence: true,
          },
        },
      },
    });

    let confirmedCount = 0;
    let skippedCount = 0;

    for (const txn of rows) {
      const line = txn.lines[0];
      if (!line) {
        skippedCount += 1;
        continue;
      }

      const confidence =
        line.confidence != null ? Number(line.confidence) : null;
      if (
        confidence == null ||
        confidence < minConfidence ||
        (!line.mainCategoryId && !line.subCategoryId)
      ) {
        skippedCount += 1;
        continue;
      }

      const validation = validateLineCategoryAssignment({
        mainCategoryId: line.mainCategoryId,
        subCategoryId: line.subCategoryId,
      });
      if (validation.error) {
        skippedCount += 1;
        continue;
      }

      if (line.mainCategoryId && !line.subCategoryId) {
        const subCount = await prisma.subCategory.count({
          where: { mainCategoryId: line.mainCategoryId },
        });
        if (subCount > 0) {
          skippedCount += 1;
          continue;
        }
      }

      const result = await saveTransactionCategorization({
        transactionId: txn.id,
        mainCategoryId: line.mainCategoryId,
        subCategoryId: line.subCategoryId,
        entityId: entityId ?? line.entityId,
        description: line.description,
        confirm: true,
      });

      if (result.error) {
        skippedCount += 1;
        continue;
      }

      confirmedCount += 1;
    }

    if (confirmedCount === 0) {
      return {
        error:
          "No transactions met the confidence threshold or could be confirmed.",
        skippedCount,
      };
    }

    return { success: true, confirmedCount, skippedCount };
  } catch (error) {
    console.error("[bulkConfirmHighConfidence]", error);
    return { error: "Could not bulk confirm transactions." };
  }
}
