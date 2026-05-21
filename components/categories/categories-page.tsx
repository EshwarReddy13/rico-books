import { CategoriesTab } from "@/components/categories/categories-tab";
import type {
  MainCategorySummary,
  SubCategorySummary,
} from "@/lib/categories/types";
import type { EntitySummary } from "@/lib/entities/types";

export function CategoriesPage({
  mains,
  subsByMain,
  entities,
}: {
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
}) {
  return (
    <CategoriesTab mains={mains} subsByMain={subsByMain} entities={entities} />
  );
}
