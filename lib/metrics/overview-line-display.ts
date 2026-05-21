/** How a P&L line should look in the overview drill-down list. */
export function overviewLineAmountDisplay(
  pnlSign: "income" | "expense",
  direction: "debit" | "credit",
): {
  className: string;
  prefix: "+" | "−";
  hint: string | null;
} {
  if (pnlSign === "expense") {
    if (direction === "credit") {
      return {
        className: "text-emerald-700",
        prefix: "+",
        hint: "Refund",
      };
    }
    return {
      className: "text-rose-600",
      prefix: "−",
      hint: null,
    };
  }

  if (direction === "credit") {
    return {
      className: "text-emerald-700",
      prefix: "+",
      hint: null,
    };
  }
  return {
    className: "text-rose-600",
    prefix: "−",
    hint: "Reversal",
  };
}
