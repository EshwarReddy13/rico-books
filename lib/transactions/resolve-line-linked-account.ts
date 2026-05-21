import type { LinkedRecordType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LineLinkedAccount = {
  linkedAccountId: string;
  linkedAccountType: LinkedRecordType;
};

/** Copy register link from sub-category when categorizing to Assets / Loans subs. */
export async function resolveLineLinkedAccountFromSub(
  subCategoryId: string | null,
): Promise<LineLinkedAccount | null> {
  if (!subCategoryId) {
    return null;
  }

  const sub = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    select: {
      linkedRecordId: true,
      linkedRecordType: true,
      mainCategory: { select: { name: true } },
    },
  });

  if (
    !sub?.linkedRecordId ||
    !sub.linkedRecordType ||
    (sub.mainCategory.name !== "Assets" && sub.mainCategory.name !== "Loans")
  ) {
    return null;
  }

  return {
    linkedAccountId: sub.linkedRecordId,
    linkedAccountType: sub.linkedRecordType,
  };
}
