import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import type { CategoryPeriod } from "@/lib/categories/types";
import { loadSubCategoriesByMain } from "@/lib/categories/load-sub-categories";
import { computeCategoryMainMetrics } from "@/lib/metrics/compute-category-metrics";

const PERIODS: CategoryPeriod[] = ["This FY", "This month", "Last month"];

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mainCategoryId = searchParams.get("mainCategoryId")?.trim();
  const period = searchParams.get("period") as CategoryPeriod | null;
  const entityId = searchParams.get("entityId")?.trim() || null;

  if (!mainCategoryId || !period || !PERIODS.includes(period)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  if (mainCategoryId.startsWith("placeholder-")) {
    return NextResponse.json({
      totalPaise: 0,
      transactionCount: 0,
      pendingReviewPaise: 0,
      pendingReviewCount: 0,
      subs: [],
      recent: [],
    });
  }

  const dbSubs = await loadSubCategoriesByMain(mainCategoryId);
  const metrics = await computeCategoryMainMetrics(
    mainCategoryId,
    period,
    entityId,
    dbSubs,
  );

  return NextResponse.json(metrics);
}
