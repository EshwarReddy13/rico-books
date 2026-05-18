import { AssetsPage } from "@/components/accounts/assets-page";
import { loadAssets } from "@/lib/accounts/load-accounts";

export const dynamic = "force-dynamic";

export default async function Page() {
  const accounts = await loadAssets();

  return <AssetsPage accounts={accounts} />;
}
