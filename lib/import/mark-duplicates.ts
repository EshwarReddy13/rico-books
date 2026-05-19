import type { ImportParseRow } from "@/lib/import/types";
import { prisma } from "@/lib/prisma";

export async function markDuplicateImportRows(
  sourceAccountId: string,
  rows: ImportParseRow[],
): Promise<ImportParseRow[]> {
  if (rows.length === 0) {
    return rows;
  }

  const fingerprints = rows.map((r) => r.fingerprint);
  const existing = await prisma.transaction.findMany({
    where: {
      sourceAccountId,
      fingerprint: { in: fingerprints },
    },
    select: { fingerprint: true },
  });

  const existingSet = new Set(existing.map((e) => e.fingerprint));

  return rows.map((row) => ({
    ...row,
    isDuplicate: existingSet.has(row.fingerprint),
  }));
}
