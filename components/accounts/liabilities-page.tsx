"use client";

import { useState } from "react";

import { AccountRegisterGrid } from "@/components/accounts/account-register-grid";
import { LiabilityFormDialog } from "@/components/accounts/liability-form-dialog";
import { LoanScheduleViewDialog } from "@/components/loans/loan-schedule-view-dialog";
import type {
  AccountCardSummary,
  FinancableAssetOption,
} from "@/lib/accounts/types";

type LiabilityDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; account: AccountCardSummary };

type ScheduleDialogState =
  | { open: false }
  | { open: true; loanId: string; liabilityName: string };

export function LiabilitiesPage({
  accounts,
  financableAssets,
}: {
  accounts: AccountCardSummary[];
  financableAssets: FinancableAssetOption[];
}) {
  const [dialog, setDialog] = useState<LiabilityDialogState>({ open: false });
  const [scheduleDialog, setScheduleDialog] = useState<ScheduleDialogState>({
    open: false,
  });

  return (
    <>
      <AccountRegisterGrid
        accounts={accounts}
        variant="liability"
        addLabel="Add liability"
        onAdd={() => setDialog({ open: true, mode: "create" })}
        onEditAccount={(account) =>
          setDialog({ open: true, mode: "edit", account })
        }
        onViewSchedule={(account) => {
          if (!account.loanId) {
            return;
          }
          setScheduleDialog({
            open: true,
            loanId: account.loanId,
            liabilityName: account.name,
          });
        }}
      />

      {dialog.open ? (
        <LiabilityFormDialog
          mode={dialog.mode}
          account={dialog.mode === "edit" ? dialog.account : null}
          financableAssets={financableAssets}
          onClose={() => setDialog({ open: false })}
          onViewSchedule={(loanId, liabilityName) =>
            setScheduleDialog({ open: true, loanId, liabilityName })
          }
        />
      ) : null}

      {scheduleDialog.open ? (
        <LoanScheduleViewDialog
          loanId={scheduleDialog.loanId}
          liabilityName={scheduleDialog.liabilityName}
          onClose={() => setScheduleDialog({ open: false })}
        />
      ) : null}
    </>
  );
}
