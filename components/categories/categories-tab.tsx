"use client";

import { useMemo, useState } from "react";

import { CategoryMixChartCard } from "@/components/categories/category-mix-chart-card";
import { CategoryRecentCard } from "@/components/categories/category-recent-card";
import { CategorySummaryStrip } from "@/components/categories/category-summary-strip";
import { MainCategoryCards } from "@/components/categories/main-category-cards";
import { SubCategoryBreakdownCard } from "@/components/categories/sub-category-breakdown-card";
import { getPlaceholderCategoryView } from "@/lib/categories/placeholder-data";
import type {
  CategoryPeriod,
  MainCategorySummary,
} from "@/lib/categories/types";

export function CategoriesTab({ mains }: { mains: MainCategorySummary[] }) {
  const [selectedId, setSelectedId] = useState(mains[0]?.id ?? "");
  const [period, setPeriod] = useState<CategoryPeriod>("This FY");

  const selectedMain = useMemo(
    () => mains.find((m) => m.id === selectedId) ?? mains[0],
    [mains, selectedId],
  );

  const view = useMemo(() => {
    if (!selectedMain) {
      return getPlaceholderCategoryView("Income", period);
    }
    return getPlaceholderCategoryView(selectedMain.name, period);
  }, [selectedMain, period]);

  if (!selectedMain) {
    return null;
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
      <MainCategoryCards
        mains={mains}
        selectedId={selectedMain.id}
        onSelect={setSelectedId}
      />

      <CategorySummaryStrip
        main={selectedMain}
        period={period}
        onPeriodChange={setPeriod}
        totalUsd={view.totalUsd}
        transactionCount={view.transactionCount}
        pendingReviewUsd={view.pendingReviewUsd}
        pendingReviewCount={view.pendingReviewCount}
      />

      <div className="grid min-w-0 w-full max-w-full gap-4 lg:grid-cols-5 lg:gap-5">
        <div className="min-w-0 lg:col-span-3">
          <SubCategoryBreakdownCard subs={view.subs} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <CategoryMixChartCard
            mainName={selectedMain.name}
            totalUsd={view.totalUsd}
            subs={view.subs}
          />
          <CategoryRecentCard mainName={selectedMain.name} items={view.recent} />
        </div>
      </div>
    </div>
  );
}
