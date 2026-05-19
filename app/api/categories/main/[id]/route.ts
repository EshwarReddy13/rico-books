import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  deleteMainCategoryRecord,
  updateMainCategoryRecord,
} from "@/lib/categories/category-mutations";
import { requireSession } from "@/lib/api/require-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const result = await updateMainCategoryRecord(id, body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteMainCategoryRecord(id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
