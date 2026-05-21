import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { bulkConfirmHighConfidence } from "@/lib/transactions/bulk-confirm-mutations";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: {
    transactionIds?: string[];
    minConfidence?: number;
    entityId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transactionIds = Array.isArray(body.transactionIds)
    ? body.transactionIds.filter((id) => typeof id === "string" && id.trim())
    : [];

  const result = await bulkConfirmHighConfidence({
    transactionIds,
    minConfidence: body.minConfidence,
    entityId: body.entityId,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
