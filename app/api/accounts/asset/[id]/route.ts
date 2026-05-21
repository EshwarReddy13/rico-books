import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  deleteRegisterAssetRecord,
  updateRegisterAssetRecord,
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
    assetType?: string;
    openingBalance?: string;
    openingDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updateRegisterAssetRecord(id, body);

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

  try {
    const result = await deleteRegisterAssetRecord(id);

    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[DELETE /api/accounts/asset]", error);
    return NextResponse.json(
      { error: "Could not delete asset. Try again." },
      { status: 500 },
    );
  }
}
