"use client";

import { useEffect, useState } from "react";

import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import {
  ActionWidget,
  ExpensesMonthWidget,
  FavoriteSpendsWidget,
} from "@/components/dashboard/dashboard-widgets";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { useSelectedEntityId } from "@/lib/dashboard/selected-entity";
import type { EntitySummary } from "@/lib/entities/types";
import { fetchDashboardMetrics } from "@/lib/metrics/metrics-api";
import type { DashboardMetrics } from "@/lib/metrics/types";

export function DashboardHome({ entities }: { entities: EntitySummary[] }) {
  const entityId = useSelectedEntityId(entities);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchDashboardMetrics(entityId)
      .then((data) => {
        if (!cancelled) {
          setMetrics(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load dashboard figures.");
          setMetrics(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return (
    <>
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : null}
      <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-7">
          <OverviewCards entityId={entityId} />
        </div>
        <div className="xl:col-span-5">
          <AnalyticsSection analytics={metrics?.analytics ?? null} />
        </div>
      </div>

      <div className="grid min-w-0 w-full max-w-full gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-5">
          <TransactionsSection
            transactions={metrics?.recentTransactions ?? []}
          />
        </div>
        <div className="grid gap-4 xl:col-span-7">
          <ActionWidget />
          <div className="grid gap-4 sm:grid-cols-2">
            <ExpensesMonthWidget
              data={metrics?.expensesThisMonth ?? null}
            />
            <FavoriteSpendsWidget
              spends={metrics?.favoriteSpends ?? []}
            />
          </div>
        </div>
      </div>
    </>
  );
}
