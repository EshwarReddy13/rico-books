/** Default HDFC statement column headers (v1 import parser). */
export const DEFAULT_HDFC_COLUMN_MAPPING = {
  date: "Date",
  narration: "Narration",
  referenceNo: "Chq./Ref.No.",
  valueDate: "Value Dt",
  withdrawal: "Withdrawal Amt.",
  deposit: "Deposit Amt.",
  closingBalance: "Closing Balance",
} as const;

export type BankColumnMapping = typeof DEFAULT_HDFC_COLUMN_MAPPING;
