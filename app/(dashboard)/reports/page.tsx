import { ReportsPage } from "@/components/reports/reports-page";
import { loadEntities } from "@/lib/entities/load-entities";

export const dynamic = "force-dynamic";

export default async function Page() {
  const entities = await loadEntities();
  return <ReportsPage entities={entities} />;
}
