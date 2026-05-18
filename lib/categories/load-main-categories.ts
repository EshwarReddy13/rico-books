import { prisma } from "@/lib/prisma";
import {
  MAIN_CATEGORY_ORDER,
  sortMainCategories,
} from "@/lib/categories/placeholder-data";
import type { MainCategorySummary } from "@/lib/categories/types";
import {
  FALLBACK_LABEL_COLOR,
  MAIN_CATEGORY_SEED_COLORS,
} from "@/lib/colors/palette";

export async function loadMainCategories(): Promise<MainCategorySummary[]> {
  const rows = await prisma.mainCategory.findMany({
    include: {
      _count: { select: { subCategories: true } },
    },
  });

  const mains: MainCategorySummary[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    colorHex: row.colorHex,
    kind: row.kind,
    pnlSign: row.pnlSign,
    subCategoryCount: row._count.subCategories,
  }));

  if (mains.length === 0) {
    return MAIN_CATEGORY_ORDER.map((name, i) => ({
      id: `placeholder-${i}`,
      name,
      description: "",
      colorHex: MAIN_CATEGORY_SEED_COLORS[name] ?? FALLBACK_LABEL_COLOR,
      kind: ["Income", "Expense"].includes(name)
        ? "pnl"
        : "balance_sheet",
      pnlSign:
        name === "Income"
          ? "income"
          : name === "Expense"
            ? "expense"
            : null,
      subCategoryCount: 0,
    }));
  }

  return sortMainCategories(mains);
}
