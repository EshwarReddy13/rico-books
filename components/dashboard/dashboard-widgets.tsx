"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { ImportDialog } from "@/components/dashboard/import-dialog";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatAmount } from "@/lib/dashboard/currency";
import { cn } from "@/lib/utils";

function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-5 shadow-sm transition hover:bg-zinc-50 sm:rounded-3xl dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
    </button>
  );
}

export function ActionWidget() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        Actions
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          label="Import"
          icon={Upload}
          onClick={() => setImportOpen(true)}
        />
        <ActionButton label="Transfer" icon={ArrowUpRight} />
        <ActionButton label="Receive" icon={ArrowDownLeft} />
      </div>
      {importOpen ? <ImportDialog onClose={() => setImportOpen(false)} /> : null}
    </section>
  );
}

const BAR_COLORS = ["bg-teal-400", "bg-emerald-300", "bg-violet-400"] as const;

export function ExpensesMonthWidget({
  data,
}: {
  data: {
    monthLabel: string;
    totalPaise: number;
    topSubs: { name: string; amountPaise: number; sharePercent: number }[];
  } | null;
}) {
  const { currency } = useCurrency();
  const subs = data?.topSubs ?? [];

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">
        Expenses in {data?.monthLabel ?? "this month"}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {data != null ? formatAmount(data.totalPaise, currency) : "—"}
      </p>
      {subs.length > 0 ? (
        <div className="mt-4 flex h-2 overflow-hidden rounded-full">
          {subs.map((sub, i) => (
            <span
              key={sub.name}
              className={BAR_COLORS[i] ?? "bg-zinc-300"}
              style={{ width: `${sub.sharePercent}%` }}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-400">No expenses this month</p>
      )}
    </article>
  );
}

export function FavoriteSpendsWidget({
  spends,
}: {
  spends: { name: string; amountPaise: number; initials: string }[];
}) {
  const avatarColors = [
    "bg-sky-500",
    "bg-amber-400",
    "bg-rose-400",
    "bg-violet-500",
  ] as const;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Top expense categories</p>
      {spends.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-400">No expenses this month</p>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          {spends.map((spend, i) => (
            <span
              key={spend.name}
              title={spend.name}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-xs font-bold text-white",
                avatarColors[i] ?? "bg-zinc-500",
              )}
            >
              {spend.initials}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
