import { syncAssetCostFromFinancing } from "@/lib/accounts/sync-asset-cost-from-financing";
import { validateLineCategoryAssignment } from "@/lib/transactions/line-category";
import { resolveLineLinkedAccountFromSub } from "@/lib/transactions/resolve-line-linked-account";
import { prisma } from "@/lib/prisma";

export type SaveCategorizationInput = {
  transactionId: string;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  entityId?: string | null;
  description?: string;
  /** When true (default), marks transaction confirmed after saving the line. */
  confirm?: boolean;
  /** Confirm a pre-split EMI without changing lines. */
  confirmOnly?: boolean;
};

export type CategorizationMutationResult = {
  error?: string;
  success?: boolean;
};

export async function saveTransactionCategorization(
  input: SaveCategorizationInput,
): Promise<CategorizationMutationResult> {
  const confirm = input.confirm !== false;

  if (input.confirmOnly) {
    return confirmPreSplitTransaction(input);
  }

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
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: input.transactionId },
      select: {
        id: true,
        amountPaise: true,
        status: true,
        lines: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            mainCategoryId: true,
            subCategoryId: true,
          },
        },
        matchedScheduleRow: { select: { id: true } },
      },
    });

    if (!transaction) {
      return { error: "Transaction not found." };
    }

    if (transaction.lines.length > 1) {
      return {
        error:
          "This transaction is an EMI split. Confirm it without changing categories.",
      };
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
    const linked =
      subId != null
        ? await resolveLineLinkedAccountFromSub(subId)
        : null;

    await prisma.$transaction(async (tx) => {
      const lineData = {
        mainCategoryId: mainId,
        subCategoryId: subId,
        entityId,
        description,
        linkedAccountId: linked?.linkedAccountId ?? null,
        linkedAccountType: linked?.linkedAccountType ?? null,
        ...(confirm ? { confidence: null } : {}),
      };

      if (lineId) {
        await tx.transactionLine.update({
          where: { id: lineId },
          data: lineData,
        });
      } else {
        await tx.transactionLine.create({
          data: {
            transactionId: transaction.id,
            amountPaise: transaction.amountPaise,
            ...lineData,
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

    if (
      linked?.linkedAccountType === "asset" &&
      linked.linkedAccountId
    ) {
      await syncAssetCostFromFinancing(linked.linkedAccountId);
    }

    return { success: true };
  } catch (error) {
    console.error("[saveTransactionCategorization]", error);
    return { error: "Could not save categorization." };
  }
}

async function confirmPreSplitTransaction(
  input: SaveCategorizationInput,
): Promise<CategorizationMutationResult> {
  const entityId = input.entityId?.trim() || null;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: input.transactionId },
      select: {
        id: true,
        amountPaise: true,
        lines: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            amountPaise: true,
            mainCategoryId: true,
            subCategoryId: true,
          },
        },
        matchedScheduleRow: { select: { id: true } },
      },
    });

    if (!transaction) {
      return { error: "Transaction not found." };
    }

    if (transaction.lines.length < 2 && !transaction.matchedScheduleRow) {
      return { error: "This transaction is not a pre-split EMI." };
    }

    let lineSum = BigInt(0);
    for (const line of transaction.lines) {
      if (!line.mainCategoryId && !line.subCategoryId) {
        return { error: "All split lines must be categorized before confirming." };
      }
      lineSum += line.amountPaise;
    }

    if (lineSum !== transaction.amountPaise) {
      return { error: "Split lines do not sum to the transaction amount." };
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

    await prisma.$transaction(async (tx) => {
      if (entityId) {
        await tx.transactionLine.updateMany({
          where: { transactionId: transaction.id },
          data: { entityId, confidence: null },
        });
      } else {
        await tx.transactionLine.updateMany({
          where: { transactionId: transaction.id },
          data: { confidence: null },
        });
      }

      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "confirmed" },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("[confirmPreSplitTransaction]", error);
    return { error: "Could not confirm transaction." };
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
