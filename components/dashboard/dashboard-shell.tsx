"use client";

import { CurrencyProvider } from "@/components/dashboard/currency-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ImportBankAccountsProvider } from "@/components/dashboard/import-bank-accounts-context";
import type { ImportBankAccountOption } from "@/lib/accounts/types";
import type { NavUser } from "@/lib/dashboard/nav-user";

export function DashboardShell({
  user,
  importBankAccounts,
  children,
}: {
  user?: NavUser | null;
  importBankAccounts: ImportBankAccountOption[];
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <ImportBankAccountsProvider accounts={importBankAccounts}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto">
            <DashboardHeader user={user} />
            {children}
          </main>
        </div>
      </ImportBankAccountsProvider>
    </CurrencyProvider>
  );
}
