import {
  computePnlFromLines,
  fetchLinesThrough,
  filterLines,
  trendFromTotals,
} from "@/lib/metrics/line-aggregate";
import {
  formatTxnDate,
  monthBucketsInRange,
  previousComparableRange,
  resolvePeriodRange,
} from "@/lib/metrics/period-range";
import type { ReportsMetrics } from "@/lib/metrics/types";

const DONUT_COLORS = [
  "stroke-sky-400",
  "stroke-violet-500",
  "stroke-zinc-700",
  "stroke-amber-400",
  "stroke-emerald-400",
] as const;

const MIX_COLORS = ["bg-sky-400", "bg-amber-400", "bg-violet-500"] as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function computeReportsMetrics(
  entityId: string | null,
): Promise<ReportsMetrics> {
  const now = new Date();
  const fyRange = resolvePeriodRange("This FY", now);
  const priorFy = previousComparableRange(fyRange);

  const allLines = await fetchLinesThrough(now);

  const fyPnlLines = filterLines(allLines, {
    ...fyRange,
    entityId,
    confirmedOnly: true,
    pnlOnly: true,
  });
  const priorPnlLines = filterLines(allLines, {
    ...priorFy,
    entityId,
    confirmedOnly: true,
    pnlOnly: true,
  });

  const totals = computePnlFromLines(fyPnlLines);
  const priorTotals = computePnlFromLines(priorPnlLines);

  const taxEstimatePaise =
    totals.profitPaise > 0 ? Math.round(totals.profitPaise * 0.3) : 0;
  const priorTax =
    priorTotals.profitPaise > 0
      ? Math.round(priorTotals.profitPaise * 0.3)
      : 0;

  const incomeTrend = trendFromTotals(
    totals.incomePaise,
    priorTotals.incomePaise,
  );
  const expenseTrend = trendFromTotals(
    totals.expensePaise,
    priorTotals.expensePaise,
  );
  const profitTrend = trendFromTotals(
    totals.profitPaise,
    priorTotals.profitPaise,
  );
  const taxTrend = trendFromTotals(taxEstimatePaise, priorTax);

  const activityTotal = totals.incomePaise + totals.expensePaise;
  const progress = {
    profitPercent:
      totals.incomePaise > 0
        ? Math.min(100, Math.round((totals.profitPaise / totals.incomePaise) * 100))
        : 0,
    incomePercent:
      activityTotal > 0
        ? Math.min(100, Math.round((totals.incomePaise / activityTotal) * 100))
        : 0,
    expensePercent:
      activityTotal > 0
        ? Math.min(100, Math.round((totals.expensePaise / activityTotal) * 100))
        : 0,
    taxPercent:
      totals.profitPaise > 0
        ? Math.min(100, Math.round((taxEstimatePaise / totals.profitPaise) * 100))
        : 0,
  };

  const monthBuckets = monthBucketsInRange(fyRange);
  const monthlyFlow = monthBuckets.map((bucket) => {
    const lines = filterLines(allLines, {
      ...bucket,
      entityId,
      confirmedOnly: true,
      pnlOnly: true,
    });
    const pnl = computePnlFromLines(lines);
    return { label: bucket.label, ...pnl };
  });

  const expenseFy = filterLines(allLines, {
    ...fyRange,
    entityId,
    confirmedOnly: true,
    pnlSign: "expense",
  });

  const subTotals = new Map<string, { name: string; amountPaise: number }>();
  for (const line of expenseFy) {
    const key = line.subCategoryId ?? line.main?.id ?? "other";
    const name = line.subCategoryName ?? line.main?.name ?? "Other";
    const prev = subTotals.get(key) ?? { name, amountPaise: 0 };
    prev.amountPaise += line.amountPaise;
    subTotals.set(key, prev);
  }

  const topSubsGlobal = [...subTotals.values()]
    .sort((a, b) => b.amountPaise - a.amountPaise)
    .slice(0, 3);

  const legend = topSubsGlobal.map((sub, i) => ({
    name: sub.name,
    colorClass: MIX_COLORS[i] ?? "bg-zinc-400",
  }));

  const expenseMixMonths = monthBuckets.map((bucket) => {
    const monthLines = filterLines(allLines, {
      ...bucket,
      entityId,
      confirmedOnly: true,
      pnlSign: "expense",
    });
    const segments = topSubsGlobal.map((top) => {
      const amountPaise = monthLines
        .filter(
          (l) =>
            (l.subCategoryName ?? l.main?.name ?? "Other") === top.name,
        )
        .reduce((s, l) => s + l.amountPaise, 0);
      return { name: top.name, amountPaise };
    });
    return { label: bucket.label, segments };
  });

  const donutTotal = totals.expensePaise;
  const donutSegments = topSubsGlobal.map((sub, i) => ({
    name: sub.name,
    amountPaise: sub.amountPaise,
    percent:
      donutTotal > 0
        ? Math.round((sub.amountPaise / donutTotal) * 100)
        : 0,
    colorClass: DONUT_COLORS[i] ?? "stroke-zinc-400",
  }));

  const recentExpenses = filterLines(allLines, {
    start: fyRange.start,
    end: now,
    entityId,
    confirmedOnly: true,
    pnlSign: "expense",
  })
    .slice(0, 8)
    .map((line) => ({
      id: line.id,
      transactionId: line.transactionId,
      date: formatTxnDate(line.txnDate),
      description: line.description,
      subCategory: line.subCategoryName ?? line.main?.name ?? "—",
      entity: line.entityName ?? "Unassigned",
      amountPaise: line.amountPaise,
      status: "confirmed" as const,
    }));

  const entityMap = new Map<
    string,
    { entityId: string | null; entityName: string; transactionCount: number; amountPaise: number }
  >();
  for (const line of fyPnlLines) {
    const key = line.entityId ?? "__none__";
    const name = line.entityName ?? "Unassigned";
    const prev = entityMap.get(key) ?? {
      entityId: line.entityId,
      entityName: name,
      transactionCount: 0,
      amountPaise: 0,
    };
    prev.transactionCount += 1;
    prev.amountPaise += line.amountPaise;
    entityMap.set(key, prev);
  }

  const topEntities = [...entityMap.values()]
    .sort((a, b) => b.amountPaise - a.amountPaise)
    .slice(0, 5)
    .map((e) => ({
      ...e,
      avatar: initialsFromName(e.entityName),
    }));

  return {
    periodLabel: fyRange.label,
    totals: {
      ...totals,
      taxEstimatePaise,
      incomeTrend: { label: "Income", ...incomeTrend },
      expenseTrend: { label: "Expenses", ...expenseTrend },
      profitTrend: { label: "Profit", ...profitTrend },
      taxTrend: { label: "Tax estimate", ...taxTrend },
    },
    progress,
    monthlyFlow,
    profitTrend: monthlyFlow,
    expenseMix: { months: expenseMixMonths, legend },
    spendingDonut: {
      totalPaise: donutTotal,
      segments: donutSegments,
      trend: { label: "Expenses", ...expenseTrend },
    },
    recentExpenses,
    topEntities: topEntities.map((e) => ({
      entityId: e.entityId,
      entityName: e.entityName,
      transactionCount: e.transactionCount,
      amountPaise: e.amountPaise,
    })),
  };
}
