import { DEFAULT_SUB_CATEGORY_COLOR } from "@/lib/colors/palette";
import {
  REGISTER_MAIN_CATEGORY_NAMES,
  resolveMainCategoryByName,
} from "@/lib/categories/resolve-main-category";
import { prisma } from "@/lib/prisma";

/** System sub-categories required by EMI matching and docs (not linked to a register). */
export async function seedSystemSubCategories() {
  const expense = await resolveMainCategoryByName(
    REGISTER_MAIN_CATEGORY_NAMES.expense,
  );
  if (!expense) {
    console.warn(
      "[seedSystemSubCategories] Expense main category missing — skip Loan Interest.",
    );
    return;
  }

  await prisma.subCategory.upsert({
    where: {
      mainCategoryId_name: {
        mainCategoryId: expense.id,
        name: "Loan Interest",
      },
    },
    create: {
      mainCategoryId: expense.id,
      name: "Loan Interest",
      description: "Interest portion of loan EMIs — P&L only",
      colorHex: DEFAULT_SUB_CATEGORY_COLOR,
    },
    update: {
      description: "Interest portion of loan EMIs — P&L only",
    },
  });
}
