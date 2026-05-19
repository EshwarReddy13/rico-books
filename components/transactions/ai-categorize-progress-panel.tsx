"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AiCategorizeProgress } from "@/lib/transactions/ai-categorize-progress";
import { cn } from "@/lib/utils";

export function AiCategorizeProgressPanel({
  progress,
  onCancel,
}: {
  progress: AiCategorizeProgress;
  onCancel: () => void;
}) {
  const { completed, total, label, percent } = progress;

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col items-center text-center">
        <span className="relative mb-5 flex size-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/30">
          <Sparkles className="size-7 animate-pulse" aria-hidden />
          <span
            className="absolute inset-0 rounded-2xl bg-violet-400/40 animate-ping"
            aria-hidden
          />
        </span>

        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          AI is categorizing your transactions
        </h3>
        <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>

      <div className="mt-8 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-3xl font-bold tabular-nums tracking-tight text-violet-600 dark:text-violet-400">
            {percent}%
          </span>
          {total > 0 ? (
            <span className="text-xs font-medium tabular-nums text-zinc-500">
              {completed} / {total}
            </span>
          ) : null}
        </div>

        <div
          className="h-3 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="AI categorization progress"
        >
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-600 to-fuchsia-500",
              "transition-[width] duration-500 ease-out",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-center text-[11px] text-zinc-400">
          Progress updates as each batch finishes. You can cancel anytime.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-6 h-10 w-full"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
