import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { confirmLoanSchedule } from "@/lib/loans/schedule-mutations";
import type { LoanScheduleExtractResult } from "@/lib/loans/types";

type RouteContext = { params: Promise<{ loanId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { loanId } = await context.params;

  let body: {
    extract?: LoanScheduleExtractResult;
    replaceExisting?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.extract?.rows?.length) {
    return NextResponse.json(
      { error: "Schedule extract is required." },
      { status: 400 },
    );
  }

  const result = await confirmLoanSchedule(loanId, body.extract, {
    replaceExisting: body.replaceExisting === true,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
