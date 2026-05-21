import { createLinkedSubCategoryInTx } from "@/lib/categories/create-linked-sub-category";
import {
  parseRegisterAssetInput,
  parseRegisterAssetUpdateInput,
  parseRegisterLiabilityInput,
  type RegisterAssetInput,
  type RegisterLiabilityInput,
} from "@/lib/accounts/parse-register-account-input";
import type { AccountMutationResult } from "@/lib/accounts/account-mutations";
import { countLoansFinancingAsset } from "@/lib/accounts/loan-register-queries";
import { syncAssetCostFromFinancing } from "@/lib/accounts/sync-asset-cost-from-financing";
import { prisma } from "@/lib/prisma";

function isError(
  parsed: { error: string } | Record<string, unknown>,
): parsed is { error: string } {
  return "error" in parsed;
}

export async function createRegisterAssetRecord(
  input: RegisterAssetInput,
): Promise<AccountMutationResult> {
  const parsed = parseRegisterAssetInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: parsed.name,
          accountKind: "asset",
          assetType: parsed.assetType,
          openingValuePaise: parsed.openingValuePaise,
          openingDate: parsed.openingDate,
        },
      });

      await createLinkedSubCategoryInTx(tx, {
        accountId: account.id,
        accountName: account.name,
        registerKind: "asset",
      });

      return account;
    });

    await syncAssetCostFromFinancing(row.id);

    return { success: true, id: row.id };
  } catch (error) {
    console.error("[createRegisterAssetRecord]", error);
    return { error: "Could not create asset. Try again." };
  }
}

export async function updateRegisterAssetRecord(
  id: string,
  input: RegisterAssetInput,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const parsed = parseRegisterAssetUpdateInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  const existing = await prisma.account.findFirst({
    where: {
      id,
      accountKind: "asset",
      assetType: { not: "bank" },
    },
  });

  if (!existing) {
    return { error: "Asset not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id },
        data: {
          name: parsed.name,
          openingValuePaise: parsed.openingValuePaise,
          openingDate: parsed.openingDate,
        },
      });

      const sub = await tx.subCategory.findFirst({
        where: { linkedRecordId: id },
      });
      if (sub) {
        await tx.subCategory.update({
          where: { id: sub.id },
          data: { name: parsed.name },
        });
      }
    });

    return { success: true, id };
  } catch (error) {
    console.error("[updateRegisterAssetRecord]", error);
    return { error: "Could not update asset." };
  }
}

export async function deleteRegisterAssetRecord(
  id: string,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const existing = await prisma.account.findFirst({
    where: {
      id,
      accountKind: "asset",
      assetType: { not: "bank" },
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Asset not found." };
  }

  const loanLinkCount = await countLoansFinancingAsset(id);
  if (loanLinkCount > 0) {
    return {
      error:
        "This asset is linked to a loan. Remove or reassign the loan first.",
    };
  }

  const lineCount = await prisma.transactionLine.count({
    where: { linkedAccountId: id },
  });
  if (lineCount > 0) {
    return {
      error: `This asset has ${lineCount} categorized transaction line${lineCount === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  const sub = await prisma.subCategory.findFirst({
    where: { linkedRecordId: id },
    include: { _count: { select: { transactionLines: true } } },
  });
  if (sub && sub._count.transactionLines > 0) {
    return {
      error: `This asset's category has ${sub._count.transactionLines} transaction line${sub._count.transactionLines === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (sub) {
        await tx.subCategory.delete({ where: { id: sub.id } });
      }
      await tx.account.delete({ where: { id } });
    });
    return { success: true };
  } catch (error) {
    console.error("[deleteRegisterAssetRecord]", error);
    return { error: "Could not delete asset." };
  }
}

export async function createLiabilityAccountRecord(
  input: RegisterLiabilityInput,
): Promise<AccountMutationResult> {
  const parsed = parseRegisterLiabilityInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: parsed.name,
          accountKind: "liability",
          assetType: null,
          openingValuePaise: parsed.openingValuePaise,
          openingDate: parsed.openingDate,
        },
      });

      await createLinkedSubCategoryInTx(tx, {
        accountId: account.id,
        accountName: account.name,
        registerKind: "liability",
      });

      return account;
    });

    return { success: true, id: row.id };
  } catch (error) {
    console.error("[createLiabilityAccountRecord]", error);
    return { error: "Could not create liability. Try again." };
  }
}

export async function updateLiabilityAccountRecord(
  id: string,
  input: RegisterLiabilityInput,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const parsed = parseRegisterLiabilityInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  const existing = await prisma.account.findFirst({
    where: { id, accountKind: "liability" },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Liability not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id },
        data: {
          name: parsed.name,
          openingValuePaise: parsed.openingValuePaise,
          openingDate: parsed.openingDate,
        },
      });

      const sub = await tx.subCategory.findFirst({
        where: { linkedRecordId: id },
      });
      if (sub) {
        await tx.subCategory.update({
          where: { id: sub.id },
          data: { name: parsed.name },
        });
      }
    });

    return { success: true, id };
  } catch (error) {
    console.error("[updateLiabilityAccountRecord]", error);
    return { error: "Could not update liability." };
  }
}

export async function deleteLiabilityAccountRecord(
  id: string,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const existing = await prisma.account.findFirst({
    where: { id, accountKind: "liability" },
    include: {
      loan: {
        include: {
          scheduleRows: {
            where: { matchedTxnId: { not: null } },
            take: 1,
          },
        },
      },
    },
  });

  if (!existing) {
    return { error: "Liability not found." };
  }

  if (existing.loan?.scheduleRows.length) {
    return {
      error:
        "This loan has matched EMI transactions. Remove those matches before deleting.",
    };
  }

  const lineCount = await prisma.transactionLine.count({
    where: { linkedAccountId: id },
  });
  if (lineCount > 0) {
    return {
      error: `This liability has ${lineCount} categorized transaction line${lineCount === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  const sub = await prisma.subCategory.findFirst({
    where: { linkedRecordId: id },
    include: { _count: { select: { transactionLines: true } } },
  });
  if (sub && sub._count.transactionLines > 0) {
    return {
      error: `This liability's category has ${sub._count.transactionLines} transaction line${sub._count.transactionLines === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (existing.loan) {
        await tx.loanScheduleRow.deleteMany({
          where: { loanId: existing.loan.id },
        });
        await tx.loan.delete({ where: { id: existing.loan.id } });
      }
      if (sub) {
        await tx.subCategory.delete({ where: { id: sub.id } });
      }
      await tx.account.delete({ where: { id } });
    });
    return { success: true };
  } catch (error) {
    console.error("[deleteLiabilityAccountRecord]", error);
    return { error: "Could not delete liability." };
  }
}
