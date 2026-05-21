import { NextResponse } from "next/server";

import { suggestLineDescription } from "@/lib/ai/suggest-line-description";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: {
    rawDescription?: string;
    categoryLabel?: string;
    amountInr?: string;
    direction?: "debit" | "credit";
    entityName?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const direction = body.direction === "credit" ? "credit" : "debit";

  const result = await suggestLineDescription({
    rawDescription: body.rawDescription ?? "",
    categoryLabel: body.categoryLabel ?? "",
    amountInr: body.amountInr ?? "",
    direction,
    entityName: body.entityName ?? null,
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
