"use client";

import { AccountRegisterGrid } from "@/components/accounts/account-register-grid";
import type { AccountCardSummary } from "@/lib/accounts/types";

export function LiabilitiesPage({
  accounts,
}: {
  accounts: AccountCardSummary[];
}) {
  return (
    <AccountRegisterGrid
      accounts={accounts}
      variant="liability"
      addLabel="Add new liability"
      onAdd={() => {
        // TODO: open add-liability flow
      }}
    />
  );
}
