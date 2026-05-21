import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { loadEntities } from "@/lib/entities/load-entities";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const entities = await loadEntities();
  return <DashboardHome entities={entities} />;
}
