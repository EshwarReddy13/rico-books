import type {
  AssetType,
  BankAccountType,
  BankInstitution,
} from "@/app/generated/prisma/client";

export type AccountCardSummary = {
  id: string;
  name: string;
  assetType: AssetType | null;
  openingValuePaise: number;
  openingDate: string | null;
  bankInstitution?: BankInstitution | null;
  accountType?: BankAccountType | null;
  /** Liability only — loan header exists */
  hasLoan?: boolean;
  /** Liability only — vehicle/equipment this loan finances */
  financedAssetAccountId?: string | null;
  financedAssetName?: string | null;
  loanId?: string | null;
  scheduleRowCount?: number;
  /** Instalments linked to a bank transaction. */
  matchedScheduleCount?: number;
  /** Principal still owed (loans only; computed from schedule + linked EMIs). */
  outstandingBalancePaise?: number;
  /** Asset only — loan financing this asset */
  linkedLoanId?: string | null;
  linkedLoanName?: string | null;
  linkedLiabilityAccountId?: string | null;
  /** Asset only — sum of lines linked as down payment */
  downPaymentTotalPaise?: number;
  downPaymentCount?: number;
  /** Asset only — down payment total + loan amount financed when available */
  computedCostPaise?: number;
  costIsComputed?: boolean;
  amountFinancedPaise?: number | null;
};

export type AssetDownPaymentRow = {
  lineId: string;
  transactionId: string;
  date: string;
  amountPaise: number;
  description: string;
  status: "pending_review" | "confirmed";
  categoryName: string;
};

export type AssetDownPaymentsView = {
  assetAccountId: string;
  assetName: string;
  rows: AssetDownPaymentRow[];
  totalPaise: number;
  count: number;
};

export type FinancableAssetOption = {
  id: string;
  name: string;
  assetType: AssetType;
};

/** Bank account row for the import statement dialog picker. */
export type ImportBankAccountOption = {
  id: string;
  nickname: string;
  bankLabel: string;
  bankInstitution: BankInstitution | null;
};
