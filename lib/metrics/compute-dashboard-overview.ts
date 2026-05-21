import {
  computePnlFromLines,
  fetchLinesThrough,
  filterLines,
  trendFromTotals,
} from "@/lib/metrics/line-aggregate";
import {
  comparePeriodHint,
  formatOverviewDateRange,
  previousComparableRange,
  resolveOverviewPeriodRange,
  type OverviewCustomRange,
  type OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";
import type { DashboardOverviewMetrics } from "@/lib/metrics/types";

export async function computeDashboardOverview(
  entityId: string | null,
  preset: OverviewPeriodPreset,
  custom?: OverviewCustomRange | null,
): Promise<DashboardOverviewMetrics | { error: string }> {
  const now = new Date();
  const resolved = resolveOverviewPeriodRange(preset, now, custom);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const priorRange = previousComparableRange(resolved);
  const allLines = await fetchLinesThrough(now);

  const currentLines = filterLines(allLines, {
    start: resolved.start,
    end: resolved.end,
    entityId,
    confirmedOnly: true,
    pnlOnly: true,
  });
  const priorLines = filterLines(allLines, {
    start: priorRange.start,
    end: priorRange.end,
    entityId,
    confirmedOnly: true,
    pnlOnly: true,
  });

  const current = computePnlFromLines(currentLines);
  const prior = computePnlFromLines(priorLines);

  const incomeTrend = trendFromTotals(
    current.incomePaise,
    prior.incomePaise,
  );
  const expenseTrend = trendFromTotals(
    current.expensePaise,
    prior.expensePaise,
  );
  const profitTrend = trendFromTotals(
    current.profitPaise,
    prior.profitPaise,
  );

  return {
    preset,
    periodLabel: resolved.label,
    dateRangeLabel: formatOverviewDateRange(resolved),
    compareLabel: comparePeriodHint(preset),
    ...current,
    incomeTrend: { label: "Income", ...incomeTrend },
    expenseTrend: { label: "Expenses", ...expenseTrend },
    profitTrend: { label: "Profit", ...profitTrend },
  };
}
