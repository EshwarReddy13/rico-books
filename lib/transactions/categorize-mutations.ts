import { validateLineCategoryAssignment } from "@/lib/transactions/line-category";
import { prisma } from "@/lib/prisma";

export type SaveCategorizationInput = {
  transactionId: string;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  entityId?: string | null;
  description?: string;
  /** When true (default), marks transaction confirmed after saving the line. */
  confirm?: boolean;
};

export type CategorizationMutationResult = {
  error?: string;
  success?: boolean;
};

export async function saveTransactionCategorization(
  input: SaveCategorizationInput,
): Promise<CategorizationMutationResult> {
  const validation = validateLineCategoryAssignment({
    mainCategoryId: input.mainCategoryId,
    subCategoryId: input.subCategoryId,
  });
  if (validation.error) {
    return validation;
  }

  const mainId = input.mainCategoryId?.trim() || null;
  const subId = input.subCategoryId?.trim() || null;
  const entityId = input.entityId?.trim() || null;
  const description = input.description?.trim() ?? "";
  const confirm = input.confirm !== false;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: input.transactionId },
      select: {
        id: true,
        amountPaise: true,
        status: true,
        lines: { take: 1, orderBy: { createdAt: "asc" }, select: { id: true } },
      },
    });

    if (!transaction) {
      return { error: "Transaction not found." };
    }

    if (subId) {
      const sub = await prisma.subCategory.findUnique({
        where: { id: subId },
        select: { id: true },
      });
      if (!sub) {
        return { error: "Sub-category not found." };
      }
    }

    if (mainId) {
      const main = await prisma.mainCategory.findUnique({
        where: { id: mainId },
        select: { id: true },
      });
      if (!main) {
        return { error: "Main category not found." };
      }
    }

    if (entityId) {
      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      if (!entity) {
        return { error: "Entity not found." };
      }
    }

    const lineId = transaction.lines[0]?.id;

    await prisma.$transaction(async (tx) => {
      if (lineId) {
        await tx.transactionLine.update({
          where: { id: lineId },
          data: {
            mainCategoryId: mainId,
            subCategoryId: subId,
            entityId,
            description,
            ...(confirm ? { confidence: null } : {}),
          },
        });
      } else {
        await tx.transactionLine.create({
          data: {
            transactionId: transaction.id,
            amountPaise: transaction.amountPaise,
            mainCategoryId: mainId,
            subCategoryId: subId,
            entityId,
            description,
          },
        });
      }

      if (confirm) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "confirmed" },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[saveTransactionCategorization]", error);
    return { error: "Could not save categorization." };
  }
}

export async function deleteAllTransactions(): Promise<CategorizationMutationResult> {
  try {
    await prisma.$transaction([
      prisma.transactionLine.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.importBatch.deleteMany(),
    ]);
    return { success: true };
  } catch (error) {
    console.error("[deleteAllTransactions]", error);
    return { error: "Could not delete transactions." };
  }
}
