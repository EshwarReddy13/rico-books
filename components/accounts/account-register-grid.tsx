"use client";

import {
  Building2,
  Car,
  Landmark,
  Laptop,
  Plus,
  Scale,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatOpeningBalance } from "@/lib/accounts/format-balance";
import { getAssetTypeLabel } from "@/lib/accounts/labels";
import type { AccountCardSummary } from "@/lib/accounts/types";
import { cn } from "@/lib/utils";

function AccountIcon({
  variant,
  assetType,
}: {
  variant: "asset" | "liability";
  assetType: AccountCardSummary["assetType"];
}) {
  let Icon: LucideIcon = variant === "liability" ? Scale : Wallet;

  if (variant === "asset") {
    switch (assetType) {
      case "bank":
        Icon = Landmark;
        break;
      case "vehicle":
        Icon = Car;
        break;
      case "computer":
        Icon = Laptop;
        break;
      case "investment":
        Icon = Building2;
        break;
      default:
        Icon = Wallet;
    }
  }

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        variant === "asset"
          ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function formatOpeningDate(iso: string | null) {
  if (!iso) {
    return null;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function AccountRegisterGrid({
  accounts,
  variant,
  addLabel,
  onAdd,
}: {
  accounts: AccountCardSummary[];
  variant: "asset" | "liability";
  addLabel: string;
  onAdd?: () => void;
}) {
  const { currency } = useCurrency();

  return (
    <div className="grid min-w-0 w-full max-w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accounts.map((account) => {
        const openingDate = formatOpeningDate(account.openingDate);

        return (
          <article
            key={account.id}
            className={cn(
              "flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm",
              "dark:border-zinc-800 dark:bg-zinc-900",
              "sm:rounded-3xl sm:p-5",
            )}
          >
            <div className="flex items-start gap-3">
              <AccountIcon variant={variant} assetType={account.assetType} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {account.name}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {getAssetTypeLabel(account.assetType)}
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                Opening balance
              </p>
              <p className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatOpeningBalance(account.openingValuePaise, currency)}
              </p>
              {openingDate ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  as of {openingDate}
                </p>
              ) : null}
            </div>
          </article>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "flex min-h-[10.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center transition sm:rounded-3xl",
          "border-zinc-600 bg-zinc-950 text-white hover:bg-zinc-800",
          "dark:border-zinc-500 dark:bg-zinc-950 dark:hover:bg-zinc-800",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
          <Plus className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium sm:text-base">{addLabel}</span>
      </button>
    </div>
  );
}
