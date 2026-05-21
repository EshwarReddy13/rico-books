import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { loadLoanScheduleView } from "@/lib/loans/load-loan-schedule";

type RouteContext = { params: Promise<{ loanId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { loanId } = await context.params;
  const result = await loadLoanScheduleView(loanId);

  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
