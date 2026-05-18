import { LiabilitiesPage } from "@/components/accounts/liabilities-page";
import { loadLiabilities } from "@/lib/accounts/load-accounts";

export const dynamic = "force-dynamic";

export default async function Page() {
  const accounts = await loadLiabilities();

  return <LiabilitiesPage accounts={accounts} />;
}
