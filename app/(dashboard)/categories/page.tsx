import { CategoriesPage } from "@/components/categories/categories-page";
import { loadAllSubCategoriesGrouped } from "@/lib/categories/load-sub-categories";
import { loadMainCategories } from "@/lib/categories/load-main-categories";
import { loadEntities } from "@/lib/entities/load-entities";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [mains, subsByMain, entities] = await Promise.all([
    loadMainCategories(),
    loadAllSubCategoriesGrouped(),
    loadEntities(),
  ]);

  return (
    <CategoriesPage mains={mains} subsByMain={subsByMain} entities={entities} />
  );
}
