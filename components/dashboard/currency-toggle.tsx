"use client";

import { cn } from "@/lib/utils";

import { useCurrency } from "@/components/dashboard/currency-context";

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();
  const isUsd = currency === "USD";

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm"
      role="group"
      aria-label="Display currency"
    >
      <span
        className={cn(
          "text-xs font-semibold transition-colors",
          !isUsd ? "text-zinc-950" : "text-zinc-400",
        )}
      >
        INR
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isUsd}
        aria-label={`Currency: ${currency}`}
        onClick={toggleCurrency}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          isUsd ? "bg-primary" : "bg-zinc-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            isUsd && "translate-x-5",
          )}
        />
      </button>
      <span
        className={cn(
          "text-xs font-semibold transition-colors",
          isUsd ? "text-zinc-950" : "text-zinc-400",
        )}
      >
        USD
      </span>
    </div>
  );
}
