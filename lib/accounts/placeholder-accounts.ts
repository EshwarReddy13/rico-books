import type { AccountCardSummary } from "@/lib/accounts/types";

/** Shown when no asset accounts exist in the database yet */
export const PLACEHOLDER_ASSETS: AccountCardSummary[] = [
  {
    id: "placeholder-asset-1",
    name: "HDFC Savings",
    assetType: "bank",
    openingValuePaise: 24_500_000,
    openingDate: "2025-04-01",
  },
  {
    id: "placeholder-asset-2",
    name: "ICICI Current",
    assetType: "bank",
    openingValuePaise: 8_900_000,
    openingDate: "2025-04-01",
  },
  {
    id: "placeholder-asset-3",
    name: "VW Virtus",
    assetType: "vehicle",
    openingValuePaise: 12_000_000,
    openingDate: "2024-06-15",
  },
];

/** Shown when no liability accounts exist in the database yet */
export const PLACEHOLDER_LIABILITIES: AccountCardSummary[] = [
  {
    id: "placeholder-liability-1",
    name: "VW Virtus Car Loan",
    assetType: null,
    openingValuePaise: 9_80_000_00,
    openingDate: "2024-06-15",
  },
  {
    id: "placeholder-liability-2",
    name: "HDFC Personal Loan",
    assetType: null,
    openingValuePaise: 3_50_000_00,
    openingDate: "2023-01-10",
  },
];
