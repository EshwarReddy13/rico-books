import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  loadLoanByLiabilityAccountId,
  upsertLoanForLiability,
} from "@/lib/loans/loan-mutations";
import { requireSession } from "@/lib/api/require-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const loan = await loadLoanByLiabilityAccountId(id);

  return NextResponse.json({ loan });
}

export async function PUT(request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await upsertLoanForLiability(id, {
      agreementNo: body.agreementNo as string | undefined,
      lender: body.lender as string | undefined,
      loanType: body.loanType as string | undefined,
      amountFinanced: body.amountFinanced as string | undefined,
      tenure: body.tenure as string | undefined,
      frequency: body.frequency as string | undefined,
      totalPayable: body.totalPayable as string | undefined,
      totalInterest: body.totalInterest as string | undefined,
      scheduleGeneratedDate: body.scheduleGeneratedDate as string | undefined,
      financedAssetAccountId: body.financedAssetAccountId as string | null,
    });

    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[PUT liability loan]", error);
    return NextResponse.json(
      { error: "Could not save loan details." },
      { status: 500 },
    );
  }
}
