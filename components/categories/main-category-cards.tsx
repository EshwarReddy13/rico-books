"use client";

import { Plus } from "lucide-react";

import { getMainCategoryCardStyle } from "@/lib/categories/main-category-card-styles";
import type { MainCategorySummary } from "@/lib/categories/types";
import { cn } from "@/lib/utils";

function kindLabel(main: MainCategorySummary) {
  if (main.kind === "pnl") {
    return main.pnlSign === "income" ? "P&L · Income" : "P&L · Expense";
  }
  return "Balance sheet";
}

export function MainCategoryCards({
  mains,
  selectedId,
  onSelect,
  onAddMainCategory,
}: {
  mains: MainCategorySummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddMainCategory?: () => void;
}) {
  return (
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 pb-2 scrollbar-none">
      {mains.map((main) => {
        const active = main.id === selectedId;
        const style = getMainCategoryCardStyle(main.name);

        return (
          <button
            key={main.id}
            type="button"
            aria-pressed={active}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(main.id)}
            className={cn(
              "relative flex min-w-[8.5rem] shrink-0 flex-col items-start rounded-2xl border-1 px-4 py-3 text-left transition-all sm:min-w-[9.5rem] sm:rounded-3xl sm:px-5 sm:py-4",
              active ? style.card : style.cardMuted,
              active ? cn(style.border, "shadow-md") : "border-transparent",
              "hover:brightness-[0.98]",
            )}
          >
            {active ? (
              <span
                className={cn(
                  "absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-white",
                  style.accent,
                )}
                aria-hidden
              />
            ) : null}

            <span className="text-sm font-semibold sm:text-base">{main.name}</span>
            <span className={cn("mt-1 text-[10px] font-medium sm:text-xs", style.kind)}>
              {kindLabel(main)}
            </span>
            <span className={cn("mt-2 text-[10px] sm:text-xs", style.sub)}>
              {main.subCategoryCount} sub
              {main.subCategoryCount === 1 ? "" : "s"}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAddMainCategory}
        className={cn(
          "flex min-w-[8.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-center transition sm:min-w-[9.5rem] sm:rounded-3xl sm:px-5 sm:py-4",
          "border-zinc-600 bg-zinc-950 text-white hover:bg-zinc-800",
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white">
          <Plus className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-medium sm:text-base">Add main category</span>
      </button>
    </div>
  );
}
