"use client";

import { Pencil, Plus } from "lucide-react";

import { mainCategoryCardStyles } from "@/lib/colors/hex-styles";
import type { MainCategorySummary } from "@/lib/categories/types";
import { cn } from "@/lib/utils";

function kindLabel(main: MainCategorySummary) {
  if (main.kind === "pnl") {
    return main.pnlSign === "income" ? "P&L · Income" : "P&L · Expense";
  }
  return "Balance sheet";
}

function isPlaceholderId(id: string) {
  return id.startsWith("placeholder-");
}

export function MainCategoryCards({
  mains,
  selectedId,
  onSelect,
  onAddMainCategory,
  onEditMainCategory,
}: {
  mains: MainCategorySummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddMainCategory?: () => void;
  onEditMainCategory?: (main: MainCategorySummary) => void;
}) {
  return (
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 pb-2 scrollbar-none">
      {mains.map((main) => {
        const active = main.id === selectedId;
        const surface = mainCategoryCardStyles(main.colorHex, active);
        const canEdit = !isPlaceholderId(main.id) && onEditMainCategory;

        return (
          <div
            key={main.id}
            className="group relative min-w-[8.5rem] shrink-0 sm:min-w-[9.5rem]"
          >
            <button
              type="button"
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(main.id)}
              style={{
                backgroundColor: surface.backgroundColor,
                borderColor: surface.borderColor,
              }}
              className={cn(
                "relative flex w-full flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all sm:rounded-3xl sm:px-5 sm:py-4",
                active ? "border shadow-md" : "border-transparent",
                "hover:brightness-[0.98]",
              )}
            >
              {active ? (
                <span
                  className="absolute top-2.5 right-2.5 size-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: surface.accentColor }}
                  aria-hidden
                />
              ) : null}

              <span className="text-sm font-semibold text-zinc-950 sm:text-base">
                {main.name}
              </span>
              <span className="mt-1 text-[10px] font-medium text-zinc-600 sm:text-xs">
                {kindLabel(main)}
              </span>
              <span className="mt-2 text-[10px] text-zinc-500 sm:text-xs">
                {main.subCategoryCount} sub
                {main.subCategoryCount === 1 ? "" : "s"}
              </span>
            </button>

            {canEdit ? (
              <button
                type="button"
                aria-label={`Edit ${main.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMainCategory(main);
                }}
                className={cn(
                  "absolute top-2 z-10 rounded-full bg-white/90 p-1 text-zinc-700 shadow-sm ring-1 ring-zinc-200/80",
                  "opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white hover:text-zinc-950",
                  active ? "right-6 sm:right-7" : "right-2 top-2.5",
                )}
              >
                <Pencil className="size-2.5" aria-hidden />
              </button>
            ) : null}
          </div>
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
