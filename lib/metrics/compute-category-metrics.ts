import { DEFAULT_SUB_CATEGORY_COLOR } from "@/lib/colors/palette";
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

export function mergeSubBreakdown(
  dbSubs: SubCategorySummary[],
  metricsSubs: CategoryMainMetrics["subs"],
): import("@/lib/categories/types").SubCategoryBreakdown[] {
  const SEGMENT_COLORS = [
    { barClassName: "bg-sky-400", strokeClassName: "stroke-sky-400" },
    { barClassName: "bg-violet-500", strokeClassName: "stroke-violet-500" },
    { barClassName: "bg-amber-400", strokeClassName: "stroke-amber-400" },
    { barClassName: "bg-emerald-400", strokeClassName: "stroke-emerald-400" },
    { barClassName: "bg-rose-400", strokeClassName: "stroke-rose-400" },
  ] as const;

  const amountBySubId = new Map(
    metricsSubs.map((s) => [s.subCategoryId, s.amountPaise] as const),
  );
  const shareBySubId = new Map(
    metricsSubs.map((s) => [s.subCategoryId, s.sharePercent] as const),
  );

  const rows: import("@/lib/categories/types").SubCategoryBreakdown[] = dbSubs.map((sub, i) => {
    const colors = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const amountPaise = amountBySubId.get(sub.id) ?? 0;
    return {
      ...sub,
      amountPaise,
      sharePercent: shareBySubId.get(sub.id) ?? 0,
      barClassName: colors.barClassName,
      strokeClassName: colors.strokeClassName,
    };
  });

  const extra = metricsSubs.filter((s) => s.subCategoryId === null);
  for (const ex of extra) {
    const mainOnlyRow: import("@/lib/categories/types").SubCategoryBreakdown = {
      id: `main-only-${ex.name}`,
      mainCategoryId: dbSubs[0]?.mainCategoryId ?? "",
      name: ex.name,
      description: "",
      colorHex: DEFAULT_SUB_CATEGORY_COLOR,
      transactionCount: 0,
      linkedRecordId: null,
      linkedRecordType: null,
      linkedAccountName: null,
      amountPaise: ex.amountPaise,
      sharePercent: ex.sharePercent,
      barClassName: "bg-zinc-400",
      strokeClassName: "stroke-zinc-400",
    };
    rows.push(mainOnlyRow);
  }

  return rows.sort((a, b) => b.amountPaise - a.amountPaise) as import("@/lib/categories/types").SubCategoryBreakdown[];
}
