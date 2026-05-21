import type { CategoryPeriod } from "@/lib/categories/types";
import type { OverviewTransactionsResult } from "@/lib/metrics/list-overview-transactions";
import type { OverviewCardKind } from "@/lib/metrics/overview-transaction-filter";
import type {
  OverviewCustomRange,
  OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";
import type {
  CategoryMainMetrics,
  DashboardMetrics,
  DashboardOverviewMetrics,
  ReportsMetrics,
} from "@/lib/metrics/types";

function entityQuery(entityId: string | null): string {
  return entityId ? `?entityId=${encodeURIComponent(entityId)}` : "";
}

export async function fetchDashboardMetrics(
  entityId: string | null,
): Promise<DashboardMetrics> {
  const res = await fetch(`/api/metrics/dashboard${entityQuery(entityId)}`);
  if (!res.ok) {
    throw new Error("Failed to load dashboard metrics");
  }
  return res.json();
}

export async function fetchDashboardOverview(
  entityId: string | null,
  period: OverviewPeriodPreset,
  custom?: OverviewCustomRange | null,
): Promise<DashboardOverviewMetrics> {
  const params = new URLSearchParams({ period });
  if (entityId) {
    params.set("entityId", entityId);
  }
  if (period === "custom" && custom) {
    params.set("start", custom.start);
    params.set("end", custom.end);
  }
  const res = await fetch(`/api/metrics/dashboard/overview?${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to load overview");
  }
  return res.json();
}

export async function fetchOverviewTransactions(
  entityId: string | null,
  period: OverviewPeriodPreset,
  filter: OverviewCardKind,
  custom?: OverviewCustomRange | null,
): Promise<OverviewTransactionsResult> {
  const params = new URLSearchParams({ period, filter });
  if (entityId) {
    params.set("entityId", entityId);
  }
  if (period === "custom" && custom) {
    params.set("start", custom.start);
    params.set("end", custom.end);
  }
  const res = await fetch(
    `/api/metrics/dashboard/overview/transactions?${params}`,
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to load transactions");
  }
  return res.json();
}

export async function fetchReportsMetrics(
  entityId: string | null,
): Promise<ReportsMetrics> {
  const res = await fetch(`/api/metrics/reports${entityQuery(entityId)}`);
  if (!res.ok) {
    throw new Error("Failed to load reports metrics");
  }
  return res.json();
}

export async function fetchCategoryMetrics(
  mainCategoryId: string,
  period: CategoryPeriod,
  entityId: string | null,
): Promise<CategoryMainMetrics> {
  const params = new URLSearchParams({
    mainCategoryId,
    period,
  });
  if (entityId) {
    params.set("entityId", entityId);
  }
  const res = await fetch(`/api/metrics/category?${params}`);
  if (!res.ok) {
    throw new Error("Failed to load category metrics");
  }
  return res.json();
}
