import type { MainCategoryKind } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const REGISTER_MAIN_CATEGORY_NAMES = {
  assets: "Assets",
  loans: "Loans",
  expense: "Expense",
} as const;

export async function resolveMainCategoryByName(name: string) {
  return prisma.mainCategory.findUnique({
    where: { name },
    select: { id: true, name: true, kind: true },
  });
}

export async function requireMainCategoryByName(name: string) {
  const main = await resolveMainCategoryByName(name);
  if (!main) {
    throw new Error(
      `Main category "${name}" is missing. Run prisma db seed.`,
    );
  }
  return main;
}

export async function getRegisterMainCategoryId(
  registerKind: "asset" | "liability",
): Promise<string> {
  const mainName =
    registerKind === "asset"
      ? REGISTER_MAIN_CATEGORY_NAMES.assets
      : REGISTER_MAIN_CATEGORY_NAMES.loans;
  const main = await requireMainCategoryByName(mainName);
  return main.id;
}

export async function resolveLoanInterestSubCategoryId(): Promise<string | null> {
  const expense = await resolveMainCategoryByName(
    REGISTER_MAIN_CATEGORY_NAMES.expense,
  );
  if (!expense) {
    return null;
  }
  const sub = await prisma.subCategory.findFirst({
    where: {
      mainCategoryId: expense.id,
      name: "Loan Interest",
      linkedRecordId: null,
    },
    select: { id: true },
  });
  return sub?.id ?? null;
}

export function isBalanceSheetMain(kind: MainCategoryKind) {
  return kind === "balance_sheet";
}
