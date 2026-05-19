import { createHash } from "crypto";

export function computeTransactionFingerprint(input: {
  sourceAccountId: string;
  date: string;
  amountPaise: number;
  rawDescription: string;
  referenceNo: string;
  closingBalancePaise: number | null;
}): string {
  const payload = [
    input.sourceAccountId,
    input.date,
    String(input.amountPaise),
    input.rawDescription.trim(),
    input.referenceNo.trim(),
    input.closingBalancePaise === null
      ? ""
      : String(input.closingBalancePaise),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}
