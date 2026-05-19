import type {
  SubCategoryBreakdown,
  SubCategorySummary,
} from "@/lib/categories/types";

/** Map DB sub-categories to breakdown rows (amounts zero until real aggregates exist). */
export function mapSubBreakdownFromDb(
  dbSubs: SubCategorySummary[],
): SubCategoryBreakdown[] {
  return dbSubs.map((sub) => ({
    ...sub,
    amountUsd: 0,
    sharePercent: 0,
    barClassName: "",
    strokeClassName: "",
  }));
}
