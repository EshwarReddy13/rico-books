export type Currency = "INR" | "USD";

/** Placeholder rates for skeleton UI — replace with live rates later */
const USD_TO_INR = 83;

/**
 * Format an amount stored in paise (INR smallest unit). No USD conversion.
 * Use for bank imports and any INR-native ledger data.
 */
export function formatInrFromPaise(paise: number): string {
  const inr = paise / 100;
  const hasPaise = Math.round(paise) % 100 !== 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(inr);
}

/** Format paise with optional USD display toggle. */
export function formatAmountFromPaise(
  paise: number,
  currency: Currency,
): string {
  if (currency === "USD") {
    const usd = paise / 100 / USD_TO_INR;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(usd);
  }
  return formatInrFromPaise(paise);
}

/** Legacy name: value is paise when sourced from metrics. */
export function formatAmount(amountPaise: number, currency: Currency): string {
  return formatAmountFromPaise(amountPaise, currency);
}

/** Skeleton helper: `amountUsd` is denominated in USD; converts when showing INR. */
export function formatAmountUsd(amountUsd: number, currency: Currency): string {
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
