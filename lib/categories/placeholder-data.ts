import type {
  CategoryMainView,
  CategoryPeriod,
  MainCategorySummary,
} from "@/lib/categories/types";

const SEGMENT_COLORS = [
  {
    barClassName: "bg-sky-400",
    strokeClassName: "stroke-sky-400",
  },
  {
    barClassName: "bg-violet-500",
    strokeClassName: "stroke-violet-500",
  },
  {
    barClassName: "bg-amber-400",
    strokeClassName: "stroke-amber-400",
  },
  {
    barClassName: "bg-emerald-400",
    strokeClassName: "stroke-emerald-400",
  },
  {
    barClassName: "bg-rose-400",
    strokeClassName: "stroke-rose-400",
  },
] as const;

const viewsByMainName: Record<string, CategoryMainView> = {
  Income: {
    totalUsd: 4520,
    transactionCount: 24,
    pendingReviewUsd: 820,
    pendingReviewCount: 3,
    subs: [
      {
        id: "1",
        name: "Foreign Income",
        amountUsd: 3100,
        sharePercent: 68,
        transactionCount: 12,
        ...SEGMENT_COLORS[0],
      },
      {
        id: "2",
        name: "Domestic Income",
        amountUsd: 1420,
        sharePercent: 32,
        transactionCount: 8,
        ...SEGMENT_COLORS[1],
      },
    ],
    recent: [
      {
        id: "r1",
        date: "Apr 28, 2026",
        description: "Razorpay payout",
        subCategory: "Foreign Income",
        entity: "Agency",
        amountUsd: 450,
        status: "confirmed",
      },
      {
        id: "r2",
        date: "Apr 26, 2026",
        description: "Client wire — retainer",
        subCategory: "Domestic Income",
        entity: "Agency",
        amountUsd: 1200,
        status: "confirmed",
      },
      {
        id: "r3",
        date: "Apr 22, 2026",
        description: "USD invoice #1042",
        subCategory: "Foreign Income",
        entity: "US entity",
        amountUsd: 890,
        status: "pending_review",
      },
    ],
  },
  Expense: {
    totalUsd: 8420,
    transactionCount: 56,
    pendingReviewUsd: 340,
    pendingReviewCount: 2,
    subs: [
      {
        id: "1",
        name: "Software & Subscriptions",
        amountUsd: 2100,
        sharePercent: 25,
        transactionCount: 18,
        ...SEGMENT_COLORS[0],
      },
      {
        id: "2",
        name: "Loan Interest",
        amountUsd: 1800,
        sharePercent: 21,
        transactionCount: 6,
        ...SEGMENT_COLORS[1],
      },
      {
        id: "3",
        name: "Office & Admin",
        amountUsd: 1520,
        sharePercent: 18,
        transactionCount: 14,
        ...SEGMENT_COLORS[2],
      },
      {
        id: "4",
        name: "Travel",
        amountUsd: 1200,
        sharePercent: 14,
        transactionCount: 9,
        ...SEGMENT_COLORS[3],
      },
      {
        id: "5",
        name: "Other",
        amountUsd: 1800,
        sharePercent: 22,
        transactionCount: 9,
        ...SEGMENT_COLORS[4],
      },
    ],
    recent: [
      {
        id: "r1",
        date: "Apr 27, 2026",
        description: "AWS monthly",
        subCategory: "Software & Subscriptions",
        entity: "Agency",
        amountUsd: 89,
        status: "confirmed",
      },
      {
        id: "r2",
        date: "Apr 25, 2026",
        description: "Car loan EMI — interest",
        subCategory: "Loan Interest",
        entity: "Agency",
        amountUsd: 420,
        status: "confirmed",
      },
    ],
  },
};

const defaultView: CategoryMainView = {
  totalUsd: 0,
  transactionCount: 0,
  pendingReviewUsd: 0,
  pendingReviewCount: 0,
  subs: [],
  recent: [],
};

export function getPlaceholderCategoryView(
  mainName: string,
  _period: CategoryPeriod,
): CategoryMainView {
  return viewsByMainName[mainName] ?? defaultView;
}

export const MAIN_CATEGORY_ORDER = [
  "Income",
  "Expense",
  "Owner Contribution",
  "Assets",
  "Loans",
  "Transfer",
] as const;

export function sortMainCategories(
  mains: MainCategorySummary[],
): MainCategorySummary[] {
  const order = new Map<string, number>(
    MAIN_CATEGORY_ORDER.map((name, index) => [name, index]),
  );
  return [...mains].sort(
    (a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99),
  );
}
