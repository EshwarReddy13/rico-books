import type { ImportConfirmRow, ImportConfirmResult } from "@/lib/import/types";
import { prisma } from "@/lib/prisma";

export async function confirmImportBatch(input: {
  sourceAccountId: string;
  fileName: string;
  rows: ImportConfirmRow[];
  /** Side-nav entity — creates a draft line per imported transaction. */
  entityId?: string | null;
}): Promise<ImportConfirmResult> {
  const account = await prisma.account.findFirst({
    where: {
      id: input.sourceAccountId,
      accountKind: "asset",
      assetType: "bank",
    },
  });

  if (!account) {
    return { error: "Bank account not found." };
  }

  const toImport = input.rows.filter((r) => r.include);
  if (toImport.length === 0) {
    return { error: "Select at least one transaction to import." };
  }

  const entityId = input.entityId?.trim() || null;
  if (entityId) {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true },
    });
    if (!entity) {
      return { error: "Selected entity not found. Pick an entity in the side nav." };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          sourceAccountId: input.sourceAccountId,
          fileName: input.fileName,
          status: "completed",
          rowCount: 0,
          duplicateCount: 0,
        },
      });

      const createResult = await tx.transaction.createMany({
        data: toImport.map((row) => ({
          date: new Date(`${row.date}T12:00:00`),
          valueDate: row.valueDate
            ? new Date(`${row.valueDate}T12:00:00`)
            : null,
          amountPaise: BigInt(row.amountPaise),
          direction: row.direction,
          rawDescription: row.rawDescription,
          referenceNo: row.referenceNo,
          closingBalancePaise:
            row.closingBalancePaise === null
              ? null
              : BigInt(row.closingBalancePaise),
          sourceAccountId: input.sourceAccountId,
          fingerprint: row.fingerprint,
          importBatchId: batch.id,
          status: "pending_review" as const,
        })),
        skipDuplicates: true,
      });

      const importedCount = createResult.count;
      const skippedDuplicateCount = toImport.length - importedCount;

      await tx.importBatch.update({
        where: { id: batch.id },
        data: {
          rowCount: importedCount,
          duplicateCount: skippedDuplicateCount,
        },
      });

      if (entityId && importedCount > 0) {
        const imported = await tx.transaction.findMany({
          where: { importBatchId: batch.id },
          select: {
            id: true,
            amountPaise: true,
            rawDescription: true,
            lines: { select: { id: true }, take: 1 },
          },
        });

        const withoutLine = imported.filter((t) => t.lines.length === 0);
        if (withoutLine.length > 0) {
          await tx.transactionLine.createMany({
            data: withoutLine.map((t) => ({
              transactionId: t.id,
              amountPaise: t.amountPaise,
              entityId,
              description: t.rawDescription,
            })),
          });
        }
      }

      return { batchId: batch.id, importedCount, skippedDuplicateCount };
    });

    return {
      success: true,
      batchId: result.batchId,
      importedCount: result.importedCount,
      skippedDuplicateCount: result.skippedDuplicateCount,
    };
  } catch (error) {
    console.error("[confirmImportBatch]", error);
    return { error: "Could not save transactions. Try again." };
  }
}
