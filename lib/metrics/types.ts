import type { CategoryPeriod } from "@/lib/categories/types";

export type TrendMetric = {
  label: string;
  trend: string;
  trendUp: boolean;
};

export type PnlTotals = {
  incomePaise: number;
  expensePaise: number;
  profitPaise: number;
};

export type MonthlyPnlBucket = {
  label: string;
  incomePaise: number;
  expensePaise: number;
  profitPaise: number;
};

export type SubCategoryAmount = {
  subCategoryId: string | null;
  subCategoryName: string;
  colorHex: string;
  amountPaise: number;
};

export type EntityActivity = {
  entityId: string | null;
  entityName: string;
  transactionCount: number;
  amountPaise: number;
};

export type RecentLineItem = {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  subCategory: string;
  entity: string;
  amountPaise: number;
  status: "confirmed" | "pending_review";
};

import type { OverviewPeriodPreset } from "@/lib/metrics/overview-period";

export type DashboardOverviewMetrics = PnlTotals & {
  preset: OverviewPeriodPreset;
  periodLabel: string;
  dateRangeLabel: string;
  compareLabel: string;
  incomeTrend: TrendMetric;
  expenseTrend: TrendMetric;
  profitTrend: TrendMetric;
};

export type DashboardMetrics = {
  periodLabel: string;
  overview: DashboardOverviewMetrics;
  analytics: {
    periodIncomePaise: number;
    monthlyIncome: { label: string; incomePaise: number }[];
  };
  expensesThisMonth: {
    monthLabel: string;
    totalPaise: number;
    topSubs: { name: string; amountPaise: number; sharePercent: number }[];
  };
  favoriteSpends: { name: string; amountPaise: number; initials: string }[];
  recentTransactions: {
    id: string;
    name: string;
    description: string;
    amountPaise: number;
    isDebit: boolean;
    dateLabel: string;
  }[];
};

export type ReportsMetrics = {
  periodLabel: string;
  totals: PnlTotals & {
    taxEstimatePaise: number;
    incomeTrend: TrendMetric;
    expenseTrend: TrendMetric;
    profitTrend: TrendMetric;
    taxTrend: TrendMetric;
  };
  progress: {
    profitPercent: number;
    incomePercent: number;
    expensePercent: number;
    taxPercent: number;
  };
  monthlyFlow: MonthlyPnlBucket[];
  profitTrend: MonthlyPnlBucket[];
  expenseMix: {
    months: { label: string; segments: { name: string; amountPaise: number }[] }[];
    legend: { name: string; colorClass: string }[];
  };
  spendingDonut: {
    totalPaise: number;
    segments: { name: string; amountPaise: number; percent: number; colorClass: string }[];
    trend: TrendMetric;
  };
  recentExpenses: RecentLineItem[];
  topEntities: EntityActivity[];
};

export type CategoryMainMetrics = {
  totalPaise: number;
  transactionCount: number;
  pendingReviewPaise: number;
  pendingReviewCount: number;
  subs: {
    subCategoryId: string | null;
    name: string;
    amountPaise: number;
    sharePercent: number;
  }[];
  recent: RecentLineItem[];
};

export type CategoryMetricsRequest = {
  mainCategoryId: string;
  period: CategoryPeriod;
  entityId: string | null;
};
