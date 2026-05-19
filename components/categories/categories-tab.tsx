"use client";

import { useMemo, useState } from "react";

import { CategoryMixChartCard } from "@/components/categories/category-mix-chart-card";
import { CategoryRecentCard } from "@/components/categories/category-recent-card";
import { CategorySummaryStrip } from "@/components/categories/category-summary-strip";
import { MainCategoryCards } from "@/components/categories/main-category-cards";
import { MainCategoryFormDialog } from "@/components/categories/main-category-form-dialog";
import { SubCategoryBreakdownCard } from "@/components/categories/sub-category-breakdown-card";
import { SubCategoryFormDialog } from "@/components/categories/sub-category-form-dialog";
import { mapSubBreakdownFromDb } from "@/lib/categories/map-sub-breakdown";
import { getPlaceholderCategoryView } from "@/lib/categories/placeholder-data";
import type {
  CategoryPeriod,
  MainCategorySummary,
  SubCategoryBreakdown,
  SubCategorySummary,
} from "@/lib/categories/types";

type MainDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; main: MainCategorySummary };

type SubDialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; sub: SubCategorySummary };

export function CategoriesTab({
  mains,
  subsByMain,
}: {
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
}) {
  const [selectedId, setSelectedId] = useState(mains[0]?.id ?? "");
  const [period, setPeriod] = useState<CategoryPeriod>("This FY");
  const [mainDialog, setMainDialog] = useState<MainDialogState>({ open: false });
  const [subDialog, setSubDialog] = useState<SubDialogState>({ open: false });

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

  const subs: SubCategoryBreakdown[] = useMemo(() => {
    if (!selectedMain) {
      return [];
    }
    return mapSubBreakdownFromDb(subsByMain[selectedMain.id] ?? []);
  }, [selectedMain, subsByMain]);

  if (!selectedMain) {
    return null;
  }

  const realMain = !selectedMain.id.startsWith("placeholder-");

  return (
  <>
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
      <MainCategoryCards
        mains={mains}
        selectedId={selectedMain.id}
        onSelect={setSelectedId}
        onAddMainCategory={() => setMainDialog({ open: true, mode: "create" })}
        onEditMainCategory={(main) =>
          setMainDialog({ open: true, mode: "edit", main })
        }
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
          <SubCategoryBreakdownCard
            subs={subs}
            onAddSubCategory={
              realMain
                ? () => setSubDialog({ open: true, mode: "create" })
                : undefined
            }
            onEditSubCategory={
              realMain
                ? (sub) => setSubDialog({ open: true, mode: "edit", sub })
                : undefined
            }
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <CategoryMixChartCard
            mainName={selectedMain.name}
            totalUsd={view.totalUsd}
            subs={subs}
          />
          <CategoryRecentCard mainName={selectedMain.name} items={view.recent} />
        </div>
      </div>
    </div>

    {mainDialog.open ? (
      <MainCategoryFormDialog
        mode={mainDialog.mode}
        main={mainDialog.mode === "edit" ? mainDialog.main : null}
        onClose={() => setMainDialog({ open: false })}
        onCreated={(id) => setSelectedId(id)}
      />
    ) : null}

    {subDialog.open && realMain ? (
      <SubCategoryFormDialog
        mode={subDialog.mode}
        sub={subDialog.mode === "edit" ? subDialog.sub : null}
        mainCategoryId={selectedMain.id}
        mainCategoryName={selectedMain.name}
        onClose={() => setSubDialog({ open: false })}
      />
    ) : null}
  </>
  );
}
