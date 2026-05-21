import {
  fetchLinesThrough,
  filterLines,
  lineMatchesEntity,
} from "@/lib/metrics/line-aggregate";
import { computeDashboardOverview } from "@/lib/metrics/compute-dashboard-overview";
import {
  formatTxnDate,
  monthBucketsInRange,
  resolvePeriodRange,
} from "@/lib/metrics/period-range";
import type { DashboardMetrics } from "@/lib/metrics/types";

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

export async function computeDashboardMetrics(
  entityId: string | null,
): Promise<DashboardMetrics> {
  const now = new Date();
  const thisMonth = resolvePeriodRange("This month", now);
  const sixMonths = resolvePeriodRange("Last 6 months", now);

  const overviewResult = await computeDashboardOverview(entityId, "month");
  if ("error" in overviewResult) {
    throw new Error(overviewResult.error);
  }

  const allLines = await fetchLinesThrough(now);

  const monthBuckets = monthBucketsInRange(sixMonths);
  const monthlyIncome = monthBuckets.map((bucket) => {
    const lines = filterLines(allLines, {
      ...bucket,
      entityId,
      confirmedOnly: true,
      pnlSign: "income",
    });
    return {
      label: bucket.label,
      incomePaise: lines.reduce((s, l) => s + l.amountPaise, 0),
    };
  });

  const expenseLines = filterLines(allLines, {
    ...thisMonth,
    entityId,
    confirmedOnly: true,
    pnlSign: "expense",
  });
  const bySub = new Map<string, { name: string; amountPaise: number }>();
  for (const line of expenseLines) {
    const key = line.subCategoryId ?? "__main_only__";
    const name = line.subCategoryName ?? "Other";
    const prev = bySub.get(key) ?? { name, amountPaise: 0 };
    prev.amountPaise += line.amountPaise;
    bySub.set(key, prev);
  }
  const topSubs = [...bySub.values()]
    .sort((a, b) => b.amountPaise - a.amountPaise)
    .slice(0, 3);
  const expenseTotal = topSubs.reduce((s, x) => s + x.amountPaise, 0);

  const monthLabel = thisMonth.start.toLocaleDateString("en-IN", {
    month: "long",
    timeZone: "UTC",
  });

  const favoriteSpends = topSubs.map((sub) => ({
    name: sub.name,
    amountPaise: sub.amountPaise,
    initials: initialsFromName(sub.name),
  }));

  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const recentTxns = new Map<
    string,
    {
      id: string;
      name: string;
      description: string;
      amountPaise: number;
      isDebit: boolean;
      dateLabel: string;
    }
  >();

  for (const line of allLines) {
    if (!lineMatchesEntity(line.entityId, entityId)) {
      continue;
    }
    if (line.txnDate < todayUtc) {
      continue;
    }
    if (recentTxns.has(line.transactionId)) {
      continue;
    }
    recentTxns.set(line.transactionId, {
      id: line.transactionId,
      name:
        line.subCategoryName ??
        line.main?.name ??
        line.txnDescription.slice(0, 40),
      description: line.description || line.txnDescription,
      amountPaise: line.txnAmountPaise,
      isDebit: line.txnDirection === "debit",
      dateLabel: "Today",
    });
    if (recentTxns.size >= 5) {
      break;
    }
  }

  if (recentTxns.size < 5) {
    for (const line of allLines) {
      if (!lineMatchesEntity(line.entityId, entityId)) {
        continue;
      }
      if (recentTxns.has(line.transactionId)) {
        continue;
      }
      recentTxns.set(line.transactionId, {
        id: line.transactionId,
        name:
          line.subCategoryName ??
          line.main?.name ??
          line.txnDescription.slice(0, 40),
        description: line.description || line.txnDescription,
        amountPaise: line.txnAmountPaise,
        isDebit: line.txnDirection === "debit",
        dateLabel: formatTxnDate(line.txnDate),
      });
      if (recentTxns.size >= 5) {
        break;
      }
    }
  }

  return {
    periodLabel: thisMonth.label,
    overview: overviewResult,
    analytics: {
      periodIncomePaise: overviewResult.incomePaise,
      monthlyIncome,
    },
    expensesThisMonth: {
      monthLabel,
      totalPaise: overviewResult.expensePaise,
      topSubs: topSubs.map((sub) => ({
        name: sub.name,
        amountPaise: sub.amountPaise,
        sharePercent:
          expenseTotal > 0
            ? Math.round((sub.amountPaise / expenseTotal) * 100)
            : 0,
      })),
    },
    favoriteSpends,
    recentTransactions: [...recentTxns.values()],
  };
}
