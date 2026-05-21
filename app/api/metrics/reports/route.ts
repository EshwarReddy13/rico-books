import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { computeReportsMetrics } from "@/lib/metrics/compute-reports-metrics";

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId")?.trim() || null;

  const metrics = await computeReportsMetrics(entityId);
  return NextResponse.json(metrics);
}
