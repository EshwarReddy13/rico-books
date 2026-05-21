"use client";

import { useEffect, useState } from "react";

import { ReportsCategoryMixCard } from "@/components/reports/reports-category-mix-card";
import { ReportsMetricCards } from "@/components/reports/reports-metric-cards";
import { ReportsMonthlyFlowCard } from "@/components/reports/reports-monthly-flow-card";
import { ReportsProfitTrendCard } from "@/components/reports/reports-profit-trend-card";
import { ReportsRecentCard } from "@/components/reports/reports-recent-card";
import { ReportsSpendingDonutCard } from "@/components/reports/reports-spending-donut-card";
import { ReportsTopEntitiesCard } from "@/components/reports/reports-top-entities-card";
import { useSelectedEntityId } from "@/lib/dashboard/selected-entity";
import type { EntitySummary } from "@/lib/entities/types";
import { fetchReportsMetrics } from "@/lib/metrics/metrics-api";
import type { ReportsMetrics } from "@/lib/metrics/types";

export function ReportsPage({ entities }: { entities: EntitySummary[] }) {
  const entityId = useSelectedEntityId(entities);
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReportsMetrics(entityId)
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
  }, [entityId]);

  return (
    <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
      <div className="grid gap-4 xl:col-span-5">
        <ReportsMetricCards metrics={metrics} />
      </div>
      <div className="xl:col-span-7">
        <ReportsCategoryMixCard mix={metrics?.expenseMix ?? null} />
      </div>

      <div className="xl:col-span-4">
        <ReportsMonthlyFlowCard flow={metrics?.monthlyFlow ?? []} />
      </div>
      <div className="xl:col-span-8">
        <ReportsProfitTrendCard trend={metrics?.profitTrend ?? []} />
      </div>

      <div className="xl:col-span-4">
        <ReportsSpendingDonutCard donut={metrics?.spendingDonut ?? null} />
      </div>
      <div className="xl:col-span-4">
        <ReportsRecentCard items={metrics?.recentExpenses ?? []} />
      </div>
      <div className="xl:col-span-4">
        <ReportsTopEntitiesCard entities={metrics?.topEntities ?? []} />
      </div>
    </div>
  );
}
