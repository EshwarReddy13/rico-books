import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { confirmImportBatch } from "@/lib/import/import-mutations";
import type { ImportConfirmRow } from "@/lib/import/types";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: {
    accountId?: string;
    fileName?: string;
    rows?: ImportConfirmRow[];
    entityId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await confirmImportBatch({
    sourceAccountId: body.accountId?.trim() ?? "",
    fileName: body.fileName?.trim() ?? "import",
    rows: body.rows ?? [],
    entityId: body.entityId,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
