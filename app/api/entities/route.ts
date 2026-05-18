import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { createEntityRecord } from "@/lib/entities/entity-mutations";

export async function POST(request: Request) {
  console.log("[api/entities] POST received");

  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  let body: { name?: string; description?: string; colorHex?: string };
  try {
    body = await request.json();
    console.log("[api/entities] body:", body);
  } catch (error) {
    console.error("[api/entities] invalid JSON body:", error);
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await createEntityRecord(body);
  console.log("[api/entities] result:", result);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
