import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { saveTransactionCategorization } from "@/lib/transactions/categorize-mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  let body: {
    mainCategoryId?: string | null;
    subCategoryId?: string | null;
    entityId?: string | null;
    description?: string;
    confirm?: boolean;
    confirmOnly?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await saveTransactionCategorization({
    transactionId: id,
    mainCategoryId: body.mainCategoryId,
    subCategoryId: body.subCategoryId,
    entityId: body.entityId,
    description: body.description,
    confirm: body.confirm,
    confirmOnly: body.confirmOnly,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
