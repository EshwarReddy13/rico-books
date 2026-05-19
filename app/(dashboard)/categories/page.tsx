import { CategoriesPage } from "@/components/categories/categories-page";
import { loadAllSubCategoriesGrouped } from "@/lib/categories/load-sub-categories";
import { loadMainCategories } from "@/lib/categories/load-main-categories";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [mains, subsByMain] = await Promise.all([
    loadMainCategories(),
    loadAllSubCategoriesGrouped(),
  ]);

  return <CategoriesPage mains={mains} subsByMain={subsByMain} />;
}
