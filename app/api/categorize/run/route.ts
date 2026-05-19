import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { runAiCategorization } from "@/lib/ai/run-ai-categorization";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: {
    importBatchId?: string | null;
    transactionIds?: string[];
    revalidate?: boolean;
  } = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text) as typeof body;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await runAiCategorization({
    importBatchId: body.importBatchId?.trim() || null,
    transactionIds: body.transactionIds,
  });

  if (result.error) {
    const status = result.error.includes("GEMINI") ? 400 : 502;
    return NextResponse.json(result, { status });
  }

  if (body.revalidate !== false) {
    revalidatePath("/", "layout");
  }
  return NextResponse.json(result);
}
