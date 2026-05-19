import { NextResponse } from "next/server";

import { generateGeminiText } from "@/lib/ai/gemini-client";
import { getGeminiConfig } from "@/lib/ai/config";
import { requireSession } from "@/lib/api/require-session";

/** Verify Gemini API key and model. GET /api/ai/ping while signed in. */
export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { isConfigured, model } = getGeminiConfig();

  if (!isConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "GEMINI_API_KEY is missing. Add it to .env and restart the dev server.",
      },
      { status: 400 },
    );
  }

  try {
    const reply = await generateGeminiText(
      'Reply with exactly this sentence and nothing else: "Rico Books AI is connected."',
    );

    return NextResponse.json({
      ok: true,
      model,
      reply,
    });
  } catch (error) {
    console.error("[api/ai/ping]", error);
    const message =
      error instanceof Error ? error.message : "Gemini request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
