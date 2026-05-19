"use client";

import { Check, Loader2, Sparkles, PenLine, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AiCategorizeProgressPanel } from "@/components/transactions/ai-categorize-progress-panel";
import { Button } from "@/components/ui/button";
import type { AiCategorizeProgress } from "@/lib/transactions/ai-categorize-progress";
import { cn } from "@/lib/utils";

export type CategorizeMode = "ai" | "manual";

export function CategorizeModePrompt({
  open,
  pending,
  aiProgress,
  error,
  transactionCount,
  onConfirm,
  onCancelAi,
  onClose,
}: {
  open: boolean;
  pending?: boolean;
  aiProgress?: AiCategorizeProgress | null;
  error?: string | null;
  transactionCount?: number;
  onConfirm: (mode: CategorizeMode) => void;
  onCancelAi: () => void;
  onClose: () => void;
}) {
  const [selectedMode, setSelectedMode] = useState<CategorizeMode>("ai");

  const isAiRunning = pending && aiProgress != null;
  const countLabel =
    transactionCount != null && transactionCount > 0
      ? `${transactionCount} transaction${transactionCount === 1 ? "" : "s"}`
      : "your pending transactions";

  useEffect(() => {
    if (open && !pending) {
      setSelectedMode("ai");
    }
  }, [open, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        disabled={pending}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="categorize-mode-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        {!isAiRunning ? (
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        ) : null}

        {isAiRunning && aiProgress ? (
          <AiCategorizeProgressPanel
            progress={aiProgress}
            onCancel={onCancelAi}
          />
        ) : (
          <>
            <div className="border-b border-zinc-100 px-6 py-5 pr-12 dark:border-zinc-800">
              <h2
                id="categorize-mode-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                How do you want to categorize?
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {countLabel} need categories. Choose an option below, then
                continue.
              </p>
            </div>

            <div className="space-y-3 px-6 py-5">
              {error ? (
                <p
                  className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div
                role="radiogroup"
                aria-labelledby="categorize-mode-title"
                className="space-y-3"
              >
                <ModeOption
                  mode="ai"
                  selected={selectedMode === "ai"}
                  disabled={pending}
                  icon={
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                      <Sparkles className="size-5" aria-hidden />
                    </span>
                  }
                  title="Use AI to categorize"
                  description="Rico Books sends your category tree and transaction details to Gemini, then pre-fills suggestions. You review and confirm each one."
                  onSelect={() => setSelectedMode("ai")}
                />

                <ModeOption
                  mode="manual"
                  selected={selectedMode === "manual"}
                  disabled={pending}
                  icon={
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                      <PenLine className="size-5" aria-hidden />
                    </span>
                  }
                  title="Categorize manually"
                  description="Open the picker with no AI suggestions. Choose main and sub-categories yourself for each transaction."
                  onSelect={() => setSelectedMode("manual")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <Button
                type="button"
                className="h-11 w-full bg-zinc-950 text-white hover:bg-zinc-900"
            disabled={pending}
            onClick={() => onConfirm(selectedMode)}
              >
                {pending && !aiProgress ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Check
                    className="size-4"
                    data-icon="inline-start"
                    aria-hidden
                  />
                )}
                Continue
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={pending}
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModeOption({
  mode,
  selected,
  disabled,
  icon,
  title,
  description,
  onSelect,
}: {
  mode: CategorizeMode;
  selected: boolean;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition disabled:opacity-60",
        selected
          ? mode === "ai"
            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20 dark:border-violet-500 dark:bg-violet-950/50"
            : "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 dark:border-zinc-300 dark:bg-zinc-800/80"
          : mode === "ai"
            ? "border-violet-200 bg-violet-50/50 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20 dark:hover:bg-violet-950/40"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/80",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </span>
          {selected ? (
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-white",
                mode === "ai" ? "bg-violet-600" : "bg-zinc-900",
              )}
              aria-hidden
            >
              <Check className="size-3" />
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </span>
      </span>
    </button>
  );
}
