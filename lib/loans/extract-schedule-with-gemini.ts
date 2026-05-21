import { Type } from "@google/genai";

import { generateGeminiJson } from "@/lib/ai/gemini-client";
import type { LoanScheduleExtractResult } from "@/lib/loans/types";

const scheduleSchema = {
  type: Type.OBJECT,
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        agreementNo: { type: Type.STRING },
        lender: { type: Type.STRING },
        loanType: { type: Type.STRING },
        amountFinancedPaise: { type: Type.INTEGER },
        tenure: { type: Type.INTEGER },
        frequency: { type: Type.STRING },
        totalPayablePaise: { type: Type.INTEGER },
        totalInterestPaise: { type: Type.INTEGER },
        scheduleGeneratedDate: { type: Type.STRING },
      },
      required: [
        "amountFinancedPaise",
        "tenure",
        "totalPayablePaise",
        "totalInterestPaise",
      ],
    },
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          installmentNo: { type: Type.INTEGER },
          dueDate: { type: Type.STRING },
          emiAmountPaise: { type: Type.INTEGER },
          principalAmountPaise: { type: Type.INTEGER },
          interestAmountPaise: { type: Type.INTEGER },
          closingBalancePaise: { type: Type.INTEGER },
        },
        required: [
          "installmentNo",
          "dueDate",
          "emiAmountPaise",
          "principalAmountPaise",
          "interestAmountPaise",
          "closingBalancePaise",
        ],
      },
    },
  },
  required: ["header", "rows"],
};

type GeminiScheduleResponse = {
  header: {
    agreementNo?: string;
    lender?: string;
    loanType?: string;
    amountFinancedPaise: number;
    tenure: number;
    frequency?: string;
    totalPayablePaise: number;
    totalInterestPaise: number;
    scheduleGeneratedDate?: string;
  };
  rows: Array<{
    installmentNo: number;
    dueDate: string;
    emiAmountPaise: number;
    principalAmountPaise: number;
    interestAmountPaise: number;
    closingBalancePaise: number;
  }>;
};

/** Send PDF bytes to Gemini and extract amortization schedule (amounts in paise). */
export async function extractScheduleFromPdf(
  pdfBuffer: Buffer,
): Promise<LoanScheduleExtractResult | { error: string }> {
  const base64 = pdfBuffer.toString("base64");

  try {
    const raw = await generateGeminiJson<GeminiScheduleResponse>({
      systemInstruction: `You extract loan amortization schedules from bank PDFs for Indian personal/business books.
All money amounts must be integers in paise (₹1 = 100 paise). Example: ₹47,216.00 → 4721600.
Dates as ISO YYYY-MM-DD. Include every instalment row in order.`,
      prompt: `Extract the loan header and full amortization table from this PDF.`,
      schema: scheduleSchema,
      pdfBase64: base64,
    });

    return {
      header: {
        agreementNo: raw.header.agreementNo?.trim() ?? "",
        lender: raw.header.lender?.trim() ?? "",
        loanType: raw.header.loanType?.trim() ?? "",
        amountFinancedPaise: raw.header.amountFinancedPaise,
        tenure: raw.header.tenure,
        frequency: raw.header.frequency?.trim() || "monthly",
        totalPayablePaise: raw.header.totalPayablePaise,
        totalInterestPaise: raw.header.totalInterestPaise,
        scheduleGeneratedDate: raw.header.scheduleGeneratedDate?.trim() || null,
      },
      rows: raw.rows.map((r) => ({
        installmentNo: r.installmentNo,
        dueDate: r.dueDate.slice(0, 10),
        emiAmountPaise: r.emiAmountPaise,
        principalAmountPaise: r.principalAmountPaise,
        interestAmountPaise: r.interestAmountPaise,
        closingBalancePaise: r.closingBalancePaise,
      })),
    };
  } catch (error) {
    console.error("[extractScheduleFromPdf]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not read schedule from PDF.",
    };
  }
}
