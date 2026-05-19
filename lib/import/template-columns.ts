import { DEFAULT_HDFC_COLUMN_MAPPING } from "@/lib/accounts/default-hdfc-mapping";

/** v1 import template / HDFC statement columns (row 0 headers). */
export const IMPORT_TEMPLATE_HEADERS = [
  DEFAULT_HDFC_COLUMN_MAPPING.date,
  DEFAULT_HDFC_COLUMN_MAPPING.narration,
  DEFAULT_HDFC_COLUMN_MAPPING.referenceNo,
  DEFAULT_HDFC_COLUMN_MAPPING.valueDate,
  DEFAULT_HDFC_COLUMN_MAPPING.withdrawal,
  DEFAULT_HDFC_COLUMN_MAPPING.deposit,
  DEFAULT_HDFC_COLUMN_MAPPING.closingBalance,
] as const;

export type ImportColumnMapping = {
  date: string;
  narration: string;
  referenceNo: string;
  valueDate: string;
  withdrawal: string;
  deposit: string;
  closingBalance: string;
};

export const DEFAULT_IMPORT_COLUMN_MAPPING: ImportColumnMapping = {
  ...DEFAULT_HDFC_COLUMN_MAPPING,
};
