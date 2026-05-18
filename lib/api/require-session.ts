import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

export async function requireSession() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    console.warn("[api] requireSession: no session — returning 401 JSON");
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Unauthorized. Sign in and try again." },
        { status: 401 },
      ),
    };
  }

  return { session, unauthorized: null };
}
