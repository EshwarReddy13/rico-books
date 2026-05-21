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

const PLACEHOLDER_SUB_BASE = {
  mainCategoryId: "placeholder",
  description: "",
  colorHex: "#94a3b8",
  linkedRecordId: null,
  linkedRecordType: null,
  linkedAccountName: null,
} as const;

const viewsByMainName: Record<string, CategoryMainView> = {
  Income: {
    totalPaise: 4520,
    transactionCount: 24,
    pendingReviewPaise: 820,
    pendingReviewCount: 3,
    subs: [
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "1",
        name: "Foreign Income",
        amountPaise: 3100,
        sharePercent: 68,
        transactionCount: 12,
        ...SEGMENT_COLORS[0],
      },
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "2",
        name: "Domestic Income",
        amountPaise: 1420,
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
        amountPaise: 450,
        status: "confirmed",
      },
      {
        id: "r2",
        date: "Apr 26, 2026",
        description: "Client wire — retainer",
        subCategory: "Domestic Income",
        entity: "Agency",
        amountPaise: 1200,
        status: "confirmed",
      },
      {
        id: "r3",
        date: "Apr 22, 2026",
        description: "USD invoice #1042",
        subCategory: "Foreign Income",
        entity: "US entity",
        amountPaise: 890,
        status: "pending_review",
      },
    ],
  },
  Expense: {
    totalPaise: 8420,
    transactionCount: 56,
    pendingReviewPaise: 340,
    pendingReviewCount: 2,
    subs: [
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "1",
        name: "Software & Subscriptions",
        amountPaise: 2100,
        sharePercent: 25,
        transactionCount: 18,
        ...SEGMENT_COLORS[0],
      },
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "2",
        name: "Loan Interest",
        amountPaise: 1800,
        sharePercent: 21,
        transactionCount: 6,
        ...SEGMENT_COLORS[1],
      },
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "3",
        name: "Office & Admin",
        amountPaise: 1520,
        sharePercent: 18,
        transactionCount: 14,
        ...SEGMENT_COLORS[2],
      },
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "4",
        name: "Travel",
        amountPaise: 1200,
        sharePercent: 14,
        transactionCount: 9,
        ...SEGMENT_COLORS[3],
      },
      {
        ...PLACEHOLDER_SUB_BASE,
        id: "5",
        name: "Other",
        amountPaise: 1800,
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
        amountPaise: 89,
        status: "confirmed",
      },
      {
        id: "r2",
        date: "Apr 25, 2026",
        description: "Car loan EMI — interest",
        subCategory: "Loan Interest",
        entity: "Agency",
        amountPaise: 420,
        status: "confirmed",
      },
    ],
  },
};

const defaultView: CategoryMainView = {
  totalPaise: 0,
  transactionCount: 0,
  pendingReviewPaise: 0,
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
