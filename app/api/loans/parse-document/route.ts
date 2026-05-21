import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { parseLoanPdfBuffer } from "@/lib/loans/parse-loan-pdf";

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
  }

  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json(
      { error: "PDF must be under 12 MB." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseLoanPdfBuffer(buffer);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/loans/parse-document]", error);
    return NextResponse.json(
      { error: "Could not read PDF. Try again." },
      { status: 500 },
    );
  }
}
