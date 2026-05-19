import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { deleteAllTransactions } from "@/lib/transactions/categorize-mutations";

/** Delete all transactions, lines, and import batches (testing). */
export async function DELETE() {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const result = await deleteAllTransactions();
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
