export type Currency = "INR" | "USD";

/** Placeholder rates for skeleton UI — replace with live rates later */
const USD_TO_INR = 83;

export function formatAmount(amountUsd: number, currency: Currency): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amountUsd);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amountUsd * USD_TO_INR));
}
