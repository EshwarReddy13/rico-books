"use client";

import { useState } from "react";

import { AccountRegisterGrid } from "@/components/accounts/account-register-grid";
import { BankAccountFormDialog } from "@/components/accounts/bank-account-form-dialog";
import type { AccountCardSummary } from "@/lib/accounts/types";

type BankDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; account: AccountCardSummary };

export function AssetsPage({ accounts }: { accounts: AccountCardSummary[] }) {
  const [dialog, setDialog] = useState<BankDialogState>({ open: false });

  return (
    <>
      <AccountRegisterGrid
        accounts={accounts}
        variant="asset"
        addLabel="Add bank account"
        onAdd={() => setDialog({ open: true, mode: "create" })}
        onEditAccount={(account) =>
          setDialog({ open: true, mode: "edit", account })
        }
      />

      {dialog.open ? (
        <BankAccountFormDialog
          mode={dialog.mode}
          account={dialog.mode === "edit" ? dialog.account : null}
          onClose={() => setDialog({ open: false })}
        />
      ) : null}
    </>
  );
}
