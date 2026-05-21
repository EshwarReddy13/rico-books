import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { loadAssetDownPaymentsView } from "@/lib/accounts/load-asset-down-payments";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const result = await loadAssetDownPaymentsView(id);

  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
