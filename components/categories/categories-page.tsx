import { CategoriesTab } from "@/components/categories/categories-tab";
import type {
  MainCategorySummary,
  SubCategorySummary,
} from "@/lib/categories/types";

export function CategoriesPage({
  mains,
  subsByMain,
}: {
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
}) {
  return <CategoriesTab mains={mains} subsByMain={subsByMain} />;
}
