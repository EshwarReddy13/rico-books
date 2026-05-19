/** Gemini model from Google AI Studio (see GEMINI_MODEL in .env). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const model =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  return {
    apiKey,
    model,
    isConfigured: apiKey.length > 0,
  };
}
