/** Which overview card was clicked. */
export type OverviewCardKind = "profit" | "income" | "expense";

export const OVERVIEW_CARD_LABELS: Record<OverviewCardKind, string> = {
  profit: "Profit (P&L lines)",
  income: "Income",
  expense: "Expenses",
};
