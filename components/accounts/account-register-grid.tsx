"use client";

import {
  Building2,
  Car,
  CalendarDays,
  Landmark,
  Laptop,
  Plus,
  Receipt,
  Scale,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { formatBankAccountSubtitle } from "@/lib/accounts/bank-options";
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

function isEditableRegisterAccount(onEditAccount?: (account: AccountCardSummary) => void) {
  return Boolean(onEditAccount);
}

function assetCostLabel(account: AccountCardSummary): string | null {
  if (!account.costIsComputed) {
    return null;
  }
  const hasDown = (account.downPaymentTotalPaise ?? 0) > 0;
  const hasLoan = (account.amountFinancedPaise ?? 0) > 0;
  if (hasDown && hasLoan) {
    return "Cost (down payment + loan)";
  }
  if (hasLoan) {
    return "Cost (loan financed)";
  }
  if (hasDown) {
    return "Cost (down payments)";
  }
  return null;
}

export function AccountRegisterGrid({
  accounts,
  variant,
  addLabel,
  onAdd,
  onEditAccount,
  onViewSchedule,
  onViewDownPayments,
}: {
  accounts: AccountCardSummary[];
  variant: "asset" | "liability";
  addLabel: string;
  onAdd?: () => void;
  onEditAccount?: (account: AccountCardSummary) => void;
  /** Liabilities with a saved schedule — open repayment table. */
  onViewSchedule?: (account: AccountCardSummary) => void;
  /** Non-bank assets — list down payments linked to this asset. */
  onViewDownPayments?: (account: AccountCardSummary) => void;
}) {
  const { currency } = useCurrency();

  return (
    <div className="grid min-w-0 w-full max-w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accounts.map((account) => {
        const openingDate = formatOpeningDate(account.openingDate);
        const editable = isEditableRegisterAccount(onEditAccount);
        const cardClassName = cn(
          "flex min-h-[10.5rem] min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm",
          "dark:border-zinc-800 dark:bg-zinc-900",
          "sm:rounded-3xl sm:p-5",
          editable &&
            "cursor-pointer text-left transition hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600",
        );

        const isNonBankAsset =
          variant === "asset" &&
          account.assetType &&
          account.assetType !== "bank";
        const showLoanOutstanding =
          variant === "liability" &&
          account.hasLoan &&
          account.outstandingBalancePaise != null;
        const showComputedAssetCost =
          isNonBankAsset && account.costIsComputed && account.computedCostPaise != null;
        const balanceLabel = showLoanOutstanding
          ? "Outstanding balance"
          : assetCostLabel(account) ?? "Opening balance";
        const balancePaise = showLoanOutstanding
          ? account.outstandingBalancePaise!
          : showComputedAssetCost
            ? account.computedCostPaise!
            : account.openingValuePaise;

        const cardBody = (
          <>
            <div className="flex items-start gap-3">
              <AccountIcon variant={variant} assetType={account.assetType} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {account.name}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {account.bankInstitution && account.accountType
                    ? formatBankAccountSubtitle(
                        account.bankInstitution,
                        account.accountType,
                      )
                    : getAssetTypeLabel(account.assetType)}
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                {balanceLabel}
              </p>
              <p className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatOpeningBalance(balancePaise, currency)}
              </p>
              {openingDate ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  as of {openingDate}
                </p>
              ) : null}
              {variant === "liability" && account.financedAssetName ? (
                <p className="text-xs text-violet-600 dark:text-violet-400">
                  Finances: {account.financedAssetName}
                </p>
              ) : null}
              {isNonBankAsset && account.linkedLoanName ? (
                <p className="text-xs text-violet-600 dark:text-violet-400">
                  Loan: {account.linkedLoanName}
                </p>
              ) : null}
              {showComputedAssetCost &&
              (account.downPaymentTotalPaise ?? 0) > 0 &&
              (account.amountFinancedPaise ?? 0) > 0 ? (
                <p className="text-xs text-zinc-500">
                  Down payment + financed amount
                </p>
              ) : null}
              {isNonBankAsset && (account.downPaymentCount ?? 0) > 0 ? (
                <p className="text-xs text-zinc-500">
                  {account.downPaymentCount} down payment
                  {account.downPaymentCount === 1 ? "" : "s"} linked
                </p>
              ) : null}
              {variant === "liability" &&
              account.scheduleRowCount &&
              account.scheduleRowCount > 0 ? (
                <p className="text-xs text-zinc-500">
                  Schedule: {account.matchedScheduleCount ?? 0}/
                  {account.scheduleRowCount} EMIs linked
                </p>
              ) : null}
            </div>
          </>
        );

        const canViewSchedule =
          variant === "liability" &&
          onViewSchedule &&
          account.loanId &&
          (account.scheduleRowCount ?? 0) > 0;

        const canViewDownPayments =
          isNonBankAsset &&
          onViewDownPayments &&
          (account.linkedLoanName != null || (account.downPaymentCount ?? 0) > 0);

        const hasSecondaryAction = canViewSchedule || canViewDownPayments;

        if (editable && onEditAccount && canViewSchedule) {
          return (
            <article
              key={account.id}
              className={cn(
                cardClassName,
                "cursor-default hover:border-zinc-200/80 hover:shadow-sm dark:hover:border-zinc-800",
              )}
            >
              <button
                type="button"
                onClick={() => onEditAccount(account)}
                className="flex flex-1 flex-col gap-3 text-left"
              >
                {cardBody}
              </button>
              <button
                type="button"
                onClick={() => onViewSchedule(account)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                <CalendarDays className="size-3.5" aria-hidden />
                View repayment schedule
              </button>
            </article>
          );
        }

        if (editable && onEditAccount && canViewDownPayments) {
          return (
            <article
              key={account.id}
              className={cn(
                cardClassName,
                "cursor-default hover:border-zinc-200/80 hover:shadow-sm dark:hover:border-zinc-800",
              )}
            >
              <button
                type="button"
                onClick={() => onEditAccount(account)}
                className="flex flex-1 flex-col gap-3 text-left"
              >
                {cardBody}
              </button>
              <button
                type="button"
                onClick={() => onViewDownPayments(account)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                <Receipt className="size-3.5" aria-hidden />
                View down payments
              </button>
            </article>
          );
        }

        return editable && onEditAccount && !hasSecondaryAction ? (
          <button
            key={account.id}
            type="button"
            onClick={() => onEditAccount(account)}
            className={cardClassName}
          >
            {cardBody}
          </button>
        ) : (
          <article key={account.id} className={cardClassName}>
            {cardBody}
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
