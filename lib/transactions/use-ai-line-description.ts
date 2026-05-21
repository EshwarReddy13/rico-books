"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatInrFromPaise } from "@/lib/dashboard/currency";
import { categoryLabelFromSelection } from "@/lib/transactions/categorize-helpers";
import type { CategorySelection } from "@/components/transactions/category-picker-panel";
import type { MainCategorySummary, SubCategorySummary } from "@/lib/categories/types";
import { apiSuggestLineDescription } from "@/lib/transactions/transaction-api";

function isResolvedSelection(
  selection: CategorySelection,
  subsByMain: Record<string, SubCategorySummary[]>,
): boolean {
  if (selection.subCategoryId) {
    return true;
  }
  if (selection.mainCategoryId) {
    return (subsByMain[selection.mainCategoryId]?.length ?? 0) === 0;
  }
  return false;
}

export function useAiLineDescription({
  transactionId,
  rawDescription,
  amountPaise,
  direction,
  entityName,
  mains,
  subsByMain,
  enabled = true,
}: {
  transactionId: string;
  rawDescription: string;
  amountPaise: number;
  direction: "debit" | "credit";
  entityName?: string | null;
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  enabled?: boolean;
}) {
  const [description, setDescription] = useState("");
  const [descriptionPending, setDescriptionPending] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const resetDescription = useCallback((value: string) => {
    setDescription(value);
    setDescriptionError(null);
  }, []);

  const suggestForSelection = useCallback(
    async (selection: CategorySelection) => {
      if (!enabled || !isResolvedSelection(selection, subsByMain)) {
        return;
      }

      const categoryLabel = categoryLabelFromSelection(
        selection,
        mains,
        subsByMain,
      );
      if (!categoryLabel || categoryLabel === "Uncategorized") {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setDescriptionPending(true);
      setDescriptionError(null);

      const result = await apiSuggestLineDescription(
        {
          rawDescription,
          categoryLabel,
          amountInr: formatInrFromPaise(amountPaise),
          direction,
          entityName: entityName ?? null,
        },
        controller.signal,
      );

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setDescriptionPending(false);

      if (result.error) {
        setDescriptionError(result.error);
        return;
      }

      if (result.description) {
        setDescription(result.description);
      }
    },
    [
      enabled,
      subsByMain,
      mains,
      rawDescription,
      amountPaise,
      direction,
      entityName,
    ],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [transactionId]);

  return {
    description,
    setDescription,
    descriptionPending,
    descriptionError,
    resetDescription,
    suggestForSelection,
    isResolvedSelection: (selection: CategorySelection) =>
      isResolvedSelection(selection, subsByMain),
  };
}
