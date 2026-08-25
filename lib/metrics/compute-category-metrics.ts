import {
  fetchLinesThrough,
  filterLines,
  sumLineAmounts,
} from "@/lib/metrics/line-aggregate";
import { formatTxnDate, resolvePeriodRange } from "@/lib/metrics/period-range";
import type { CategoryMainMetrics } from "@/lib/metrics/types";
import type { CategoryPeriod } from "@/lib/categories/types";
import type { SubCategorySummary } from "@/lib/categories/types";

export async function computeCategoryMainMetrics(
  mainCategoryId: string,
  period: CategoryPeriod,
  entityId: string | null,
  dbSubs: SubCategorySummary[],
): Promise<CategoryMainMetrics> {
  const range = resolvePeriodRange(period, new Date());
  const allLines = await fetchLinesThrough(range.end);

  const confirmedForMain = filterLines(allLines, {
    ...range,
    entityId,
    mainCategoryId,
    confirmedOnly: true,
  });

  const txnIds = new Set(confirmedForMain.map((l) => l.transactionId));
  const totalPaise = sumLineAmounts(confirmedForMain);

  const bySub = new Map<string | null, number>();
  for (const line of confirmedForMain) {
    const key = line.subCategoryId;
    bySub.set(key, (bySub.get(key) ?? 0) + line.amountPaise);
  }

  const subs: CategoryMainMetrics["subs"] = dbSubs.map((sub) => {
    const amountPaise = bySub.get(sub.id) ?? 0;
    return {
      subCategoryId: sub.id,
      name: sub.name,
      amountPaise,
      sharePercent:
        totalPaise > 0 ? Math.round((amountPaise / totalPaise) * 100) : 0,
    };
  });

  const mainOnlyPaise = bySub.get(null) ?? 0;
  if (mainOnlyPaise > 0) {
    subs.push({
      subCategoryId: null,
      name: "(Main category only)",
      amountPaise: mainOnlyPaise,
      sharePercent:
        totalPaise > 0 ? Math.round((mainOnlyPaise / totalPaise) * 100) : 0,
    });
  }

  subs.sort((a, b) => b.amountPaise - a.amountPaise);

  const pendingTxnIds = new Set<string>();
  let pendingReviewPaise = 0;

  for (const line of allLines) {
    if (!txnInRange(line.txnDate, range.start, range.end)) {
      continue;
    }
    if (line.txnStatus !== "pending_review") {
      continue;
    }
    if (line.main?.id !== mainCategoryId) {
      continue;
    }
    if (!lineMatchesEntity(line.entityId, entityId)) {
      continue;
    }
    pendingTxnIds.add(line.transactionId);
    pendingReviewPaise += line.amountPaise;
  }

  const recent = confirmedForMain.slice(0, 8).map((line) => ({
    id: line.id,
    transactionId: line.transactionId,
    date: formatTxnDate(line.txnDate),
    description: line.description,
    subCategory: line.subCategoryName ?? line.main?.name ?? "—",
    entity: line.entityName ?? "Unassigned",
    amountPaise: line.amountPaise,
    status: "confirmed" as const,
  }));

  return {
    totalPaise,
    transactionCount: txnIds.size,
    pendingReviewPaise,
    pendingReviewCount: pendingTxnIds.size,
    subs,
    recent,
  };
}

function txnInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function lineMatchesEntity(
  lineEntityId: string | null,
  entityId: string | null,
): boolean {
  if (!entityId) {
    return true;
  }
  return lineEntityId === entityId || lineEntityId === null;
}
