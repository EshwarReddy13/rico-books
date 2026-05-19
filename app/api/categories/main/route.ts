import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createMainCategoryRecord } from "@/lib/categories/category-mutations";
import { requireSession } from "@/lib/api/require-session";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await createMainCategoryRecord(body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
