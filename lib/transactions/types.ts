export type TransactionStatus = "pending_review" | "confirmed";

export type TransactionListRow = {
  id: string;
  /** ISO date YYYY-MM-DD for sorting */
  date: string;
  dateLabel: string;
  status: TransactionStatus;
  amountPaise: number;
  direction: "debit" | "credit";
  referenceNo: string;
  accountName: string;
  entityName: string;
  entityInitials: string;
  /** Line description or bank narration (for table + search). */
  description: string;
  categoryName: string;
  rawDescription: string;
  importBatchId: string;
  mainCategoryId: string | null;
  subCategoryId: string | null;
  entityId: string | null;
  lineDescription: string;
  /** Line has main or sub category assigned. */
  isCategorized: boolean;
  /** AI proposal confidence (0–1); null if not AI-suggested. */
  aiConfidence: number | null;
  /** Pending transaction with category filled by AI (not yet confirmed). */
  hasAiSuggestion: boolean;
  /** More than one categorization line (e.g. EMI split). */
  lineCount: number;
  /** Bank debit matched to a loan schedule row. */
  isEmiSplit: boolean;
  /** Per-line breakdown when isEmiSplit. */
  splitLines: Array<{
    amountPaise: number;
    categoryName: string;
    /** From schedule amounts — clearer than line order in the UI. */
    role: "interest" | "principal";
  }>;
};

export type TransactionSummaryBucket = {
  count: number;
  totalPaise: number;
};

export type TransactionSummary = {
  all: TransactionSummaryBucket;
  pendingReview: TransactionSummaryBucket;
  confirmed: TransactionSummaryBucket;
};
