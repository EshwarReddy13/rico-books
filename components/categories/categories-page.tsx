import { CategoriesTab } from "@/components/categories/categories-tab";
import type { MainCategorySummary } from "@/lib/categories/types";

export function CategoriesPage({ mains }: { mains: MainCategorySummary[] }) {
  return <CategoriesTab mains={mains} />;
}
