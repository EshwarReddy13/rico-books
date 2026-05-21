"use client";

import { useEffect, useMemo, useState } from "react";

import { CategoryMixChartCard } from "@/components/categories/category-mix-chart-card";
import { CategoryRecentCard } from "@/components/categories/category-recent-card";
import { CategorySummaryStrip } from "@/components/categories/category-summary-strip";
import { MainCategoryCards } from "@/components/categories/main-category-cards";
import { MainCategoryFormDialog } from "@/components/categories/main-category-form-dialog";
import { SubCategoryBreakdownCard } from "@/components/categories/sub-category-breakdown-card";
import { SubCategoryFormDialog } from "@/components/categories/sub-category-form-dialog";
import { useSelectedEntityId } from "@/lib/dashboard/selected-entity";
import { mapSubBreakdownFromDb } from "@/lib/categories/map-sub-breakdown";
import type {
  CategoryPeriod,
  MainCategorySummary,
  SubCategorySummary,
} from "@/lib/categories/types";
import type { EntitySummary } from "@/lib/entities/types";
import { mergeSubBreakdown } from "@/lib/metrics/compute-category-metrics";
import { fetchCategoryMetrics } from "@/lib/metrics/metrics-api";
import type { CategoryMainMetrics } from "@/lib/metrics/types";

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
  entities,
}: {
  mains: MainCategorySummary[];
  subsByMain: Record<string, SubCategorySummary[]>;
  entities: EntitySummary[];
}) {
  const [selectedId, setSelectedId] = useState(mains[0]?.id ?? "");
  const [period, setPeriod] = useState<CategoryPeriod>("This FY");
  const [mainDialog, setMainDialog] = useState<MainDialogState>({ open: false });
  const [subDialog, setSubDialog] = useState<SubDialogState>({ open: false });
  const [metrics, setMetrics] = useState<CategoryMainMetrics | null>(null);

  const entityId = useSelectedEntityId(entities);

  const selectedMain = useMemo(
    () => mains.find((m) => m.id === selectedId) ?? mains[0],
    [mains, selectedId],
  );

  const isPlaceholder =
    !selectedMain || selectedMain.id.startsWith("placeholder-");

  useEffect(() => {
    if (!selectedMain || isPlaceholder) {
      setMetrics(null);
      return;
    }

    let cancelled = false;
    fetchCategoryMetrics(selectedMain.id, period, entityId)
      .then((data) => {
        if (!cancelled) {
          setMetrics(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMain?.id, period, entityId, isPlaceholder]);

  const subs = useMemo(() => {
    if (!selectedMain) {
      return [];
    }
    const dbSubs = subsByMain[selectedMain.id] ?? [];
    if (!metrics) {
      return mapSubBreakdownFromDb(dbSubs);
    }
    return mergeSubBreakdown(dbSubs, metrics.subs);
  }, [selectedMain, subsByMain, metrics]);

  if (!selectedMain) {
    return null;
  }

  const realMain = !isPlaceholder;

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
          totalPaise={metrics?.totalPaise ?? 0}
          transactionCount={metrics?.transactionCount ?? 0}
          pendingReviewPaise={metrics?.pendingReviewPaise ?? 0}
          pendingReviewCount={metrics?.pendingReviewCount ?? 0}
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
              totalPaise={metrics?.totalPaise ?? 0}
              subs={subs}
            />
            <CategoryRecentCard
              mainName={selectedMain.name}
              items={metrics?.recent ?? []}
            />
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
