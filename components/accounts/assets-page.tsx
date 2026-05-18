"use client";

import { AccountRegisterGrid } from "@/components/accounts/account-register-grid";
import type { AccountCardSummary } from "@/lib/accounts/types";

export function AssetsPage({ accounts }: { accounts: AccountCardSummary[] }) {
  return (
    <AccountRegisterGrid
      accounts={accounts}
      variant="asset"
      addLabel="Add new asset"
      onAdd={() => {
        // TODO: open add-asset flow
      }}
    />
  );
}
