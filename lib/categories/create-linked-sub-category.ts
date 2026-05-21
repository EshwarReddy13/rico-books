import type { LinkedRecordType } from "@/app/generated/prisma/client";
import { DEFAULT_SUB_CATEGORY_COLOR } from "@/lib/colors/palette";
import { REGISTER_MAIN_CATEGORY_NAMES } from "@/lib/categories/resolve-main-category";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export type CreateLinkedSubCategoryInput = {
  accountId: string;
  accountName: string;
  registerKind: "asset" | "liability";
  description?: string;
};

/**
 * Creates a sub-category under Assets or Loans pointing at a register account.
 * Call inside an existing transaction when creating the account atomically.
 */
export async function createLinkedSubCategoryInTx(
  tx: Prisma.TransactionClient,
  input: CreateLinkedSubCategoryInput,
) {
  const mainName =
    input.registerKind === "asset"
      ? REGISTER_MAIN_CATEGORY_NAMES.assets
      : REGISTER_MAIN_CATEGORY_NAMES.loans;
  const main = await tx.mainCategory.findUnique({
    where: { name: mainName },
    select: { id: true },
  });
  if (!main) {
    throw new Error(`Main category "${mainName}" is missing. Run prisma db seed.`);
  }
  const linkedRecordType: LinkedRecordType =
    input.registerKind === "asset" ? "asset" : "liability";

  return tx.subCategory.create({
    data: {
      mainCategoryId: main.id,
      name: input.accountName,
      description: input.description?.trim() ?? "",
      colorHex: DEFAULT_SUB_CATEGORY_COLOR,
      linkedRecordId: input.accountId,
      linkedRecordType,
    },
    select: { id: true },
  });
}

export async function findLinkedSubCategoryForAccount(accountId: string) {
  return prisma.subCategory.findFirst({
    where: { linkedRecordId: accountId },
    select: {
      id: true,
      name: true,
      mainCategoryId: true,
      linkedRecordId: true,
      linkedRecordType: true,
    },
  });
}

export async function syncLinkedSubCategoryName(
  accountId: string,
  accountName: string,
) {
  const sub = await findLinkedSubCategoryForAccount(accountId);
  if (!sub || sub.name === accountName) {
    return;
  }
  await prisma.subCategory.update({
    where: { id: sub.id },
    data: { name: accountName },
  });
}
