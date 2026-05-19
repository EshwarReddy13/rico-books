import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createBankAccountRecord } from "@/lib/accounts/account-mutations";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

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

  const result = await createBankAccountRecord(body);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
