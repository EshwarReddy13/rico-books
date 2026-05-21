import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { computeDashboardOverview } from "@/lib/metrics/compute-dashboard-overview";
import {
  OVERVIEW_PERIOD_PRESETS,
  type OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";

const PRESET_IDS = new Set(
  OVERVIEW_PERIOD_PRESETS.map((p) => p.id),
);

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId")?.trim() || null;
  const preset = (searchParams.get("period")?.trim() ||
    "month") as OverviewPeriodPreset;

  if (!PRESET_IDS.has(preset)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const custom =
    preset === "custom"
      ? {
          start: searchParams.get("start")?.trim() ?? "",
          end: searchParams.get("end")?.trim() ?? "",
        }
      : null;

  const result = await computeDashboardOverview(entityId, preset, custom);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
