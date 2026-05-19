import { DEFAULT_HDFC_COLUMN_MAPPING } from "@/lib/accounts/default-hdfc-mapping";
import {
  DEFAULT_IMPORT_COLUMN_MAPPING,
  type ImportColumnMapping,
} from "@/lib/import/template-columns";
import { prisma } from "@/lib/prisma";

function isColumnMapping(value: unknown): value is ImportColumnMapping {
  if (!value || typeof value !== "object") {
    return false;
  }
  const m = value as Record<string, unknown>;
  return typeof m.date === "string" && typeof m.narration === "string";
}

export async function loadColumnMappingForAccount(
  accountId: string,
): Promise<ImportColumnMapping> {
  const profile = await prisma.bankAccountProfile.findFirst({
    where: { accountId },
    select: { columnMapping: true },
  });

  if (profile?.columnMapping && isColumnMapping(profile.columnMapping)) {
    return {
      date: profile.columnMapping.date ?? DEFAULT_HDFC_COLUMN_MAPPING.date,
      narration:
        profile.columnMapping.narration ?? DEFAULT_HDFC_COLUMN_MAPPING.narration,
      referenceNo:
        profile.columnMapping.referenceNo ??
        DEFAULT_HDFC_COLUMN_MAPPING.referenceNo,
      valueDate:
        profile.columnMapping.valueDate ?? DEFAULT_HDFC_COLUMN_MAPPING.valueDate,
      withdrawal:
        profile.columnMapping.withdrawal ??
        DEFAULT_HDFC_COLUMN_MAPPING.withdrawal,
      deposit:
        profile.columnMapping.deposit ?? DEFAULT_HDFC_COLUMN_MAPPING.deposit,
      closingBalance:
        profile.columnMapping.closingBalance ??
        DEFAULT_HDFC_COLUMN_MAPPING.closingBalance,
    };
  }

  return DEFAULT_IMPORT_COLUMN_MAPPING;
}
