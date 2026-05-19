export type MainCategorySummary = {
  id: string;
  name: string;
  description: string;
  colorHex: string;
  kind: "pnl" | "balance_sheet";
  pnlSign: "income" | "expense" | null;
  subCategoryCount: number;
};

export type SubCategorySummary = {
  id: string;
  mainCategoryId: string;
  name: string;
  description: string;
  colorHex: string;
  transactionCount: number;
};

export type SubCategoryBreakdown = SubCategorySummary & {
  amountUsd: number;
  sharePercent: number;
  barClassName: string;
  strokeClassName: string;
};

export type CategoryRecentTransaction = {
  id: string;
  date: string;
  description: string;
  subCategory: string;
  entity: string;
  amountUsd: number;
  status: "confirmed" | "pending_review";
};

export type CategoryPeriod = "This FY" | "This month" | "Last month";

export type CategoryMainView = {
  totalUsd: number;
  transactionCount: number;
  pendingReviewUsd: number;
  pendingReviewCount: number;
  subs: SubCategoryBreakdown[];
  recent: CategoryRecentTransaction[];
};
