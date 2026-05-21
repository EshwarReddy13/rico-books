import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createLiabilityAccountRecord } from "@/lib/accounts/register-account-mutations";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

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

  const result = await createLiabilityAccountRecord(body);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
