"use client";

import { createContext, useContext } from "react";

import type { ImportBankAccountOption } from "@/lib/accounts/types";

const ImportBankAccountsContext = createContext<ImportBankAccountOption[]>([]);

export function ImportBankAccountsProvider({
  accounts,
  children,
}: {
  accounts: ImportBankAccountOption[];
  children: React.ReactNode;
}) {
  return (
    <ImportBankAccountsContext.Provider value={accounts}>
      {children}
    </ImportBankAccountsContext.Provider>
  );
}

export function useImportBankAccounts() {
  return useContext(ImportBankAccountsContext);
}
