"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import {
  dateSortLabel,
  type DateSortOrder,
} from "@/lib/transactions/sort-transactions";
import { cn } from "@/lib/utils";

export function DateSortToggle({
  order,
  onToggle,
  className,
}: {
  order: DateSortOrder;
  onToggle: () => void;
  className?: string;
}) {
  const Icon = order === "desc" ? ArrowDown : ArrowUp;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Sort by date: ${dateSortLabel(order)}. Click to reverse.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      Date · {dateSortLabel(order)}
    </button>
  );
}
