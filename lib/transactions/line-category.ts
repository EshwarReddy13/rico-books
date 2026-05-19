/** Line with category relations loaded (from Prisma include). */
export type LineCategoryRelations = {
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  mainCategory?: { id: string; name: string } | null;
  subCategory?: {
    id: string;
    name: string;
    mainCategoryId?: string;
    mainCategory?: { id: string; name: string } | null;
  } | null;
};

export type LineCategoryAssignment = {
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
};

/** Main-only and sub-only are mutually exclusive; at least one is required when categorized. */
export function validateLineCategoryAssignment(
  input: LineCategoryAssignment,
): { error?: string } {
  const mainId = input.mainCategoryId?.trim() || null;
  const subId = input.subCategoryId?.trim() || null;

  if (!mainId && !subId) {
    return { error: "Assign a main category or a sub-category." };
  }

  if (mainId && subId) {
    return {
      error:
        "Use a sub-category (which implies its main) or a main category alone — not both.",
    };
  }

  return {};
}

/** Resolved main category id for P&L / balance-sheet logic. */
export function resolveLineMainCategoryId(
  line: LineCategoryRelations,
): string | null {
  if (line.subCategoryId && line.subCategory) {
    return (
      line.subCategory.mainCategory?.id ??
      line.subCategory.mainCategoryId ??
      null
    );
  }

  if (line.mainCategoryId) {
    return line.mainCategoryId;
  }

  return null;
}

/** Human-readable label: "Expense → Software" or "Owner Contribution". */
export function formatLineCategoryLabel(line: LineCategoryRelations): string {
  if (line.subCategory) {
    const mainName = line.subCategory.mainCategory?.name;
    if (mainName) {
      return `${mainName} → ${line.subCategory.name}`;
    }
    return line.subCategory.name;
  }

  if (line.mainCategory) {
    return line.mainCategory.name;
  }

  return "Uncategorized";
}
