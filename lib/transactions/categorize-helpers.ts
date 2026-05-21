import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import type { CategorySelection } from "@/components/transactions/category-picker-panel";
import type { TransactionListRow } from "@/lib/transactions/types";

export function selectionFromRow(row: TransactionListRow): CategorySelection {
  return {
    mainCategoryId: row.mainCategoryId,
    subCategoryId: row.subCategoryId,
  };
}

export function categoryLabelFromSelection(
  selection: CategorySelection,
  mains: MainCategorySummary[],
  subsByMain: Record<string, SubCategorySummary[]>,
): string {
  if (selection.subCategoryId) {
    for (const subs of Object.values(subsByMain)) {
      const sub = subs.find((s) => s.id === selection.subCategoryId);
      if (sub) {
        const main = mains.find((m) => m.id === sub.mainCategoryId);
        return main ? `${main.name} → ${sub.name}` : sub.name;
      }
    }
  }
  if (selection.mainCategoryId) {
    return (
      mains.find((m) => m.id === selection.mainCategoryId)?.name ?? "Categorized"
    );
  }
  return "Uncategorized";
}
