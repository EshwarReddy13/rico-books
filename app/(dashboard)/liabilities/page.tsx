import { LiabilitiesPage } from "@/components/accounts/liabilities-page";
import {
  loadFinancableAssets,
  loadLiabilities,
} from "@/lib/accounts/load-accounts";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [accounts, financableAssets] = await Promise.all([
    loadLiabilities(),
    loadFinancableAssets(),
  ]);

  return (
    <LiabilitiesPage accounts={accounts} financableAssets={financableAssets} />
  );
}
