import { Type } from "@google/genai";

import type { AiCategorizationResponse } from "@/lib/ai/categorization-types";
import { generateGeminiJson } from "@/lib/ai/gemini-client";
import { getGeminiConfig } from "@/lib/ai/config";
import {
  loadCategorizationContext,
  loadTransactionsForAiCategorization,
} from "@/lib/ai/load-categorization-context";
import {
  AI_CATEGORIZATION_SYSTEM_INSTRUCTION,
  AI_CATEGORIZATION_USER_PROMPT_FOOTER,
} from "@/lib/ai/categorization-instructions";
import { validateLineCategoryAssignment } from "@/lib/transactions/line-category";
import { prisma } from "@/lib/prisma";

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export type RunAiCategorizationResult = {
  error?: string;
  success?: boolean;
  categorizedCount?: number;
  skippedCount?: number;
};

export async function runAiCategorization(input: {
  importBatchId?: string | null;
  transactionIds?: string[];
}): Promise<RunAiCategorizationResult> {
  const { isConfigured } = getGeminiConfig();
  if (!isConfigured) {
    return {
      error:
        "GEMINI_API_KEY is not configured. Add it to .env to use AI categorization.",
    };
  }

  const transactions = await loadTransactionsForAiCategorization({
    importBatchId: input.importBatchId,
    transactionIds: input.transactionIds,
  });

  if (transactions.length === 0) {
    return { error: "No pending transactions to categorize." };
  }

  const { mains, subsByMain, entities } = await loadCategorizationContext();

  const categoryPayload = mains.map((main) => ({
    id: main.id,
    name: main.name,
    description: main.description,
    kind: main.kind,
    pnlSign: main.pnlSign,
    mainOnly: (subsByMain[main.id]?.length ?? 0) === 0,
    subCategories: (subsByMain[main.id] ?? []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
    })),
  }));

  const txnPayload = transactions.map((t) => ({
    transactionId: t.id,
    date: t.date.toISOString().slice(0, 10),
    amountInr: formatInr(Number(t.amountPaise)),
    direction: t.direction,
    rawDescription: t.rawDescription,
    referenceNo: t.referenceNo,
    accountName: t.sourceAccount.name,
    entityId: t.lines[0]?.entityId ?? null,
  }));

  const prompt = `## Categories (use these ids only)
${JSON.stringify(categoryPayload, null, 2)}

## Entities (optional — only use ids from this list)
${JSON.stringify(
  entities.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
  })),
  null,
  2,
)}

## Transactions to categorize (${txnPayload.length} items)
${JSON.stringify(txnPayload, null, 2)}

${AI_CATEGORIZATION_USER_PROMPT_FOOTER}

Return a JSON object with key "proposals": an array with one entry per transactionId listed above.`;

  let parsed: AiCategorizationResponse;
  try {
    parsed = await generateGeminiJson<AiCategorizationResponse>({
      systemInstruction: AI_CATEGORIZATION_SYSTEM_INSTRUCTION,
      prompt,
      schema: {
        type: Type.OBJECT,
        properties: {
          proposals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                transactionId: { type: Type.STRING },
                mainCategoryId: { type: Type.STRING, nullable: true },
                subCategoryId: { type: Type.STRING, nullable: true },
                description: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: [
                "transactionId",
                "description",
                "confidence",
              ],
            },
          },
        },
        required: ["proposals"],
      },
    });
  } catch (error) {
    console.error("[runAiCategorization] gemini", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "AI categorization failed. Try again or categorize manually.",
    };
  }

  const txnById = new Map(transactions.map((t) => [t.id, t]));
  const validMainIds = new Set(mains.map((m) => m.id));
  const validSubIds = new Set(
    Object.values(subsByMain)
      .flat()
      .map((s) => s.id),
  );

  let categorizedCount = 0;
  let skippedCount = 0;

  for (const proposal of parsed.proposals ?? []) {
    const txn = txnById.get(proposal.transactionId);
    if (!txn) {
      skippedCount += 1;
      continue;
    }

    if (txn.matchedScheduleRow || txn.lines.length > 1) {
      skippedCount += 1;
      continue;
    }

    const mainId = proposal.mainCategoryId?.trim() || null;
    const subId = proposal.subCategoryId?.trim() || null;

    const validation = validateLineCategoryAssignment({
      mainCategoryId: mainId,
      subCategoryId: subId,
    });
    if (validation.error) {
      skippedCount += 1;
      continue;
    }

    if (subId && !validSubIds.has(subId)) {
      skippedCount += 1;
      continue;
    }
    if (mainId && !validMainIds.has(mainId)) {
      skippedCount += 1;
      continue;
    }

    const confidence = Math.min(1, Math.max(0, Number(proposal.confidence) || 0));
    const description =
      proposal.description?.trim() || txn.rawDescription;
    const existingLine = txn.lines[0];
    const existingEntityId = existingLine?.entityId ?? null;
    const lineId = existingLine?.id;

    try {
      if (lineId) {
        await prisma.transactionLine.update({
          where: { id: lineId },
          data: {
            mainCategoryId: mainId,
            subCategoryId: subId,
            description,
            confidence,
            entityId: existingEntityId,
          },
        });
      } else {
        await prisma.transactionLine.create({
          data: {
            transactionId: txn.id,
            amountPaise: txn.amountPaise,
            mainCategoryId: mainId,
            subCategoryId: subId,
            entityId: existingEntityId,
            description,
            confidence,
          },
        });
      }
      categorizedCount += 1;
    } catch (error) {
      console.error("[runAiCategorization] save line", error);
      skippedCount += 1;
    }
  }

  if (categorizedCount === 0) {
    return {
      error:
        "AI could not apply any categorizations. Try again or categorize manually.",
    };
  }

  return { success: true, categorizedCount, skippedCount };
}
