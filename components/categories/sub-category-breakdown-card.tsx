"use client";

import { Plus } from "lucide-react";

import { useCurrency } from "@/components/dashboard/currency-context";
import { ReportCard, ReportCardHeader } from "@/components/reports/report-card";
import { subCategoryBarStyle } from "@/lib/colors/hex-styles";
import { formatAmount } from "@/lib/dashboard/currency";
import type { SubCategoryBreakdown } from "@/lib/categories/types";
import { cn } from "@/lib/utils";

export function SubCategoryBreakdownCard({
  subs,
  onAddSubCategory,
  onEditSubCategory,
}: {
  subs: SubCategoryBreakdown[];
  onAddSubCategory?: () => void;
  onEditSubCategory?: (sub: SubCategoryBreakdown) => void;
}) {
  const { currency } = useCurrency();

  return (
    <ReportCard className="flex h-full min-h-[320px] min-w-0 flex-col">
      <ReportCardHeader
        title="Sub-categories"
        action={
          <button
            type="button"
            onClick={onAddSubCategory}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="size-3.5" aria-hidden />
            Add sub-category
          </button>
        }
      />

      {subs.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No sub-categories yet. Add one to classify transactions under this
          main category.
        </p>
      ) : (
        <ul className="space-y-4">
          {subs.map((sub) => (
            <li key={sub.id}>
              <div className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {onEditSubCategory && !sub.id.startsWith("placeholder-") ? (
                      <button
                        type="button"
                        onClick={() => onEditSubCategory(sub)}
                        className="truncate text-left text-sm font-semibold text-zinc-950 hover:text-violet-700"
                      >
                        {sub.name}
                      </button>
                    ) : (
                      <p className="truncate text-sm font-semibold text-zinc-950">
                        {sub.name}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {sub.transactionCount} transaction
                      {sub.transactionCount === 1 ? "" : "s"}
                    </p>
                    {sub.linkedRecordId ? (
                      <p className="mt-1 font-mono text-[10px] text-violet-600 dark:text-violet-400">
                        Linked: {sub.linkedAccountName ?? "Account"} ·{" "}
                        {sub.linkedRecordType} · {sub.linkedRecordId.slice(0, 8)}
                        …
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-zinc-950">
                      {formatAmount(sub.amountPaise, currency)}
                    </p>
                    <p className="text-xs text-zinc-500">{sub.sharePercent}%</p>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      sub.amountPaise > 0 ? "" : "opacity-40",
                    )}
                    style={{
                      width: `${Math.max(sub.sharePercent, sub.amountPaise > 0 ? 4 : 0)}%`,
                      ...subCategoryBarStyle(sub.colorHex),
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
