import { Type } from "@google/genai";

import { generateGeminiJson } from "@/lib/ai/gemini-client";
import { getGeminiConfig } from "@/lib/ai/config";

const SYSTEM_INSTRUCTION = `You write short bookkeeping labels for bank transactions in an Indian business app.
The label is stored on the books — not the raw bank narration.
Use plain English, 3–12 words, no quotes, no category names repeated verbatim unless natural.
Do not invent vendors or amounts not implied by the bank text.`;

const MAX_DESCRIPTION_LENGTH = 200;

export type SuggestLineDescriptionInput = {
  rawDescription: string;
  categoryLabel: string;
  amountInr: string;
  direction: "debit" | "credit";
  entityName?: string | null;
};

export async function suggestLineDescription(
  input: SuggestLineDescriptionInput,
): Promise<{ description: string } | { error: string }> {
  const { isConfigured } = getGeminiConfig();
  if (!isConfigured) {
    return {
      error:
        "GEMINI_API_KEY is not set. Add it to .env to use AI descriptions.",
    };
  }

  const raw = input.rawDescription.trim();
  if (!raw) {
    return { error: "Bank description is required." };
  }

  const categoryLabel = input.categoryLabel.trim();
  if (!categoryLabel) {
    return { error: "Category is required." };
  }

  const prompt = `Bank narration:
${raw}

User chose category: ${categoryLabel}
Amount: ${input.amountInr} (${input.direction})
${input.entityName ? `Entity: ${input.entityName}` : ""}

Given this category and bank text, return one short description for the ledger line.`;

  try {
    const result = await generateGeminiJson<{ description: string }>({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt,
      schema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
        required: ["description"],
      },
    });

    const description = result.description?.trim() ?? "";
    if (!description) {
      return { error: "AI returned an empty description." };
    }

    return {
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
    };
  } catch (error) {
    console.error("[suggestLineDescription]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate description.",
    };
  }
}
