"use client";

import { useState } from "react";

import { AccountRegisterGrid } from "@/components/accounts/account-register-grid";
import { AssetDownPaymentsDialog } from "@/components/accounts/asset-down-payments-dialog";
import { BankAccountFormDialog } from "@/components/accounts/bank-account-form-dialog";
import { RegisterAssetFormDialog } from "@/components/accounts/register-asset-form-dialog";
import type { AccountCardSummary } from "@/lib/accounts/types";

type BankDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; account: AccountCardSummary };

type AssetDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; account: AccountCardSummary };

type DownPaymentsDialogState =
  | { open: false }
  | { open: true; assetAccountId: string; assetName: string };

export function AssetsPage({ accounts }: { accounts: AccountCardSummary[] }) {
  const [bankDialog, setBankDialog] = useState<BankDialogState>({ open: false });
  const [assetDialog, setAssetDialog] = useState<AssetDialogState>({
    open: false,
  });
  const [downPaymentsDialog, setDownPaymentsDialog] =
    useState<DownPaymentsDialogState>({ open: false });

  function handleEdit(account: AccountCardSummary) {
    if (account.assetType === "bank") {
      setBankDialog({ open: true, mode: "edit", account });
    } else {
      setAssetDialog({ open: true, mode: "edit", account });
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setBankDialog({ open: true, mode: "create" })}
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          Add bank account
        </button>
        <button
          type="button"
          onClick={() => setAssetDialog({ open: true, mode: "create" })}
          className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
        >
          Add asset
        </button>
      </div>

      <AccountRegisterGrid
        accounts={accounts}
        variant="asset"
        addLabel="Add bank account"
        onAdd={() => setBankDialog({ open: true, mode: "create" })}
        onEditAccount={handleEdit}
        onViewDownPayments={(account) =>
          setDownPaymentsDialog({
            open: true,
            assetAccountId: account.id,
            assetName: account.name,
          })
        }
      />

      {bankDialog.open ? (
        <BankAccountFormDialog
          mode={bankDialog.mode}
          account={bankDialog.mode === "edit" ? bankDialog.account : null}
          onClose={() => setBankDialog({ open: false })}
        />
      ) : null}

      {assetDialog.open ? (
        <RegisterAssetFormDialog
          mode={assetDialog.mode}
          account={assetDialog.mode === "edit" ? assetDialog.account : null}
          onClose={() => setAssetDialog({ open: false })}
        />
      ) : null}

      {downPaymentsDialog.open ? (
        <AssetDownPaymentsDialog
          assetAccountId={downPaymentsDialog.assetAccountId}
          assetName={downPaymentsDialog.assetName}
          onClose={() => setDownPaymentsDialog({ open: false })}
        />
      ) : null}
    </>
  );
}
