export type ImportParseRow = {
  clientId: string;
  rowNumber: number;
  date: string;
  valueDate: string | null;
  rawDescription: string;
  referenceNo: string;
  amountPaise: number;
  direction: "debit" | "credit";
  closingBalancePaise: number | null;
  fingerprint: string;
  isDuplicate: boolean;
};

export type ImportParseResult = {
  rows: ImportParseRow[];
  parseErrors: { row: number; message: string }[];
  error?: string;
};

export type ImportConfirmRow = ImportParseRow & {
  include: boolean;
};

export type ImportConfirmResult = {
  success?: boolean;
  error?: string;
  importedCount?: number;
  skippedDuplicateCount?: number;
  /** EMIs auto-matched to loan schedule on import. */
  emiMatchedCount?: number;
  batchId?: string;
};
