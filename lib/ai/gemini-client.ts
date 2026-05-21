import { GoogleGenAI, Type } from "@google/genai";

import { getGeminiConfig } from "@/lib/ai/config";

export { Type };

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const { apiKey, isConfigured } = getGeminiConfig();

  if (!isConfigured) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env — get a key from https://aistudio.google.com/apikey",
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
}

/** Simple text generation (server-side only). */
export async function generateGeminiText(prompt: string): Promise<string> {
  const { model } = getGeminiConfig();
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return (response.text ?? "").trim();
}

/** Structured JSON via Gemini response schema (for categorization batches later). */
export async function generateGeminiJson<T>({
  systemInstruction,
  prompt,
  schema,
  pdfBase64,
}: {
  systemInstruction?: string;
  prompt: string;
  schema: Record<string, unknown>;
  /** Optional PDF as base64 for document extraction. */
  pdfBase64?: string;
}): Promise<T> {
  const { model } = getGeminiConfig();
  const ai = getGeminiClient();

  const contents = pdfBase64
    ? [
        {
          role: "user" as const,
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
            { text: prompt },
          ],
        },
      ]
    : prompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  });

  const text = response.text ?? "{}";

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
}
