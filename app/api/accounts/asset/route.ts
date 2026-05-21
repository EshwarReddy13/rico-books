import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createRegisterAssetRecord } from "@/lib/accounts/register-account-mutations";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

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

  const result = await createRegisterAssetRecord(body);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
