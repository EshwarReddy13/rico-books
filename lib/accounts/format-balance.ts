import type { Currency } from "@/lib/dashboard/currency";
import { formatAmount } from "@/lib/dashboard/currency";

const USD_TO_INR = 83;

/** Format paise as a plain rupee string for form inputs. */
export function paiseToRupeeInput(paise: number): string {
  if (paise === 0) {
    return "";
  }
  const inr = paise / 100;
  return Number.isInteger(inr) ? String(inr) : inr.toFixed(2);
}

/** Format an opening balance stored as paise (INR smallest unit). */
export function formatOpeningBalance(
  paise: number,
  currency: Currency,
): string {
  const inr = paise / 100;

  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(inr);
  }

  return formatAmount(inr / USD_TO_INR, "USD");
}
