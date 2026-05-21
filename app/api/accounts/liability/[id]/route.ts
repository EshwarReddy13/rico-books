import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  deleteLiabilityAccountRecord,
  updateLiabilityAccountRecord,
} from "@/lib/accounts/register-account-mutations";
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
    openingBalance?: string;
    openingDate?: string;
    financedAssetAccountId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updateLiabilityAccountRecord(id, body);

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
  const result = await deleteLiabilityAccountRecord(id);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
