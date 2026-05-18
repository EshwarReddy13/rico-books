import { CategoriesPage } from "@/components/categories/categories-page";
import { loadMainCategories } from "@/lib/categories/load-main-categories";

export const dynamic = "force-dynamic";

export default async function Page() {
  const mains = await loadMainCategories();

  return <CategoriesPage mains={mains} />;
}
