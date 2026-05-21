import { extractScheduleFromPdf } from "@/lib/loans/extract-schedule-with-gemini";
import type { LoanScheduleExtractResult, ScheduleChecksumResult } from "@/lib/loans/types";
import { verifyScheduleChecksums } from "@/lib/loans/verify-schedule-checksums";

export type ParseLoanPdfResult =
  | { error: string }
  | {
      extract: LoanScheduleExtractResult;
      checksum: ScheduleChecksumResult;
    };

export async function parseLoanPdfBuffer(
  buffer: Buffer,
): Promise<ParseLoanPdfResult> {
  const extracted = await extractScheduleFromPdf(buffer);
  if ("error" in extracted) {
    return extracted;
  }

  const checksum = verifyScheduleChecksums(extracted);
  return { extract: extracted, checksum };
}
