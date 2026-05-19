import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  deleteBankAccountRecord,
  updateBankAccountRecord,
} from "@/lib/accounts/account-mutations";
import { requireSession } from "@/lib/api/require-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  let body: {
    name?: string;
    bankInstitution?: string;
    accountType?: string;
    openingBalance?: string;
    openingDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updateBankAccountRecord(id, body);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const result = await deleteBankAccountRecord(id);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
