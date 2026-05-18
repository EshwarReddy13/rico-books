import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import {
  deleteEntityRecord,
  updateEntityRecord,
} from "@/lib/entities/entity-mutations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  console.log("[api/entities/[id]] PATCH", id);

  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const result = await updateEntityRecord(id, body);
  console.log("[api/entities/[id]] PATCH result:", result);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  console.log("[api/entities/[id]] DELETE", id);

  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const result = await deleteEntityRecord(id);
  console.log("[api/entities/[id]] DELETE result:", result);

  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
