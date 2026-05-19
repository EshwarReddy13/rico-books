import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { resetPendingCategories } from "@/lib/transactions/reset-pending-categories";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: { importBatchId?: string | null } = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text) as { importBatchId?: string | null };
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await resetPendingCategories({
    importBatchId: body.importBatchId?.trim() || null,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
