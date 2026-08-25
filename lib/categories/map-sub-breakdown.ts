import { DEFAULT_SUB_CATEGORY_COLOR } from "@/lib/colors/palette";
import type {
  SubCategoryBreakdown,
  SubCategorySummary,
} from "@/lib/categories/types";
import type { CategoryMainMetrics } from "@/lib/metrics/types";

const SEGMENT_COLORS = [
  { barClassName: "bg-sky-400", strokeClassName: "stroke-sky-400" },
  { barClassName: "bg-violet-500", strokeClassName: "stroke-violet-500" },
  { barClassName: "bg-amber-400", strokeClassName: "stroke-amber-400" },
  { barClassName: "bg-emerald-400", strokeClassName: "stroke-emerald-400" },
  { barClassName: "bg-rose-400", strokeClassName: "stroke-rose-400" },
] as const;

/** Map DB sub-categories to breakdown rows (amounts zero until real aggregates exist). */
export function mapSubBreakdownFromDb(
  dbSubs: SubCategorySummary[],
): SubCategoryBreakdown[] {
  return dbSubs.map((sub) => ({
    ...sub,
    amountPaise: 0,
    sharePercent: 0,
    barClassName: "",
    strokeClassName: "",
  }));
}

/** Merge API metrics amounts into DB sub-category rows for the breakdown UI. */
export function mergeSubBreakdown(
  dbSubs: SubCategorySummary[],
  metricsSubs: CategoryMainMetrics["subs"],
): SubCategoryBreakdown[] {
  const amountBySubId = new Map(
    metricsSubs.map((s) => [s.subCategoryId, s.amountPaise] as const),
  );
  const shareBySubId = new Map(
    metricsSubs.map((s) => [s.subCategoryId, s.sharePercent] as const),
  );

  const rows: SubCategoryBreakdown[] = dbSubs.map((sub, i) => {
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
    rows.push({
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
    });
  }

  return rows.sort((a, b) => b.amountPaise - a.amountPaise);
}
