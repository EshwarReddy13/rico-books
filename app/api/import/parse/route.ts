import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { loadColumnMappingForAccount } from "@/lib/import/load-column-mapping";
import { markDuplicateImportRows } from "@/lib/import/mark-duplicates";
import { parseImportSpreadsheet } from "@/lib/import/parse-spreadsheet";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 },
    );
  }

  const accountId = String(formData.get("accountId") ?? "").trim();
  const file = formData.get("file");

  if (!accountId) {
    return NextResponse.json(
      { error: "Bank account is required." },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const columnMapping = await loadColumnMappingForAccount(accountId);
  const parsed = parseImportSpreadsheet(buffer, accountId, columnMapping);

  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.rows.length === 0 && parsed.parseErrors.length === 0) {
    return NextResponse.json(
      { error: "No transactions found in file." },
      { status: 400 },
    );
  }

  const rows = await markDuplicateImportRows(accountId, parsed.rows);

  return NextResponse.json({
    rows,
    parseErrors: parsed.parseErrors,
  });
}
