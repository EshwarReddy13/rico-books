import { DEFAULT_HDFC_COLUMN_MAPPING } from "@/lib/accounts/default-hdfc-mapping";
import {
  parseBankAccountInput,
  type BankAccountInput,
} from "@/lib/accounts/parse-bank-account-input";
import { prisma } from "@/lib/prisma";

export type AccountMutationResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

function isError(
  parsed: { error: string } | Record<string, unknown>,
): parsed is { error: string } {
  return "error" in parsed;
}

export async function createBankAccountRecord(
  input: BankAccountInput,
): Promise<AccountMutationResult> {
  const parsed = parseBankAccountInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    const row = await prisma.account.create({
      data: {
        name: parsed.name,
        accountKind: "asset",
        assetType: "bank",
        openingValuePaise: parsed.openingValuePaise,
        openingDate: parsed.openingDate,
        bankProfile: {
          create: {
            bankInstitution: parsed.bankInstitution,
            accountType: parsed.accountType,
            bankName: parsed.bankName,
            columnMapping: DEFAULT_HDFC_COLUMN_MAPPING,
          },
        },
      },
    });
    return { success: true, id: row.id };
  } catch (error) {
    console.error("[createBankAccountRecord]", error);
    return { error: "Could not create bank account. Try again." };
  }
}

async function findBankAccount(id: string) {
  return prisma.account.findFirst({
    where: { id, accountKind: "asset", assetType: "bank" },
    include: { bankProfile: true },
  });
}

export async function updateBankAccountRecord(
  id: string,
  input: BankAccountInput,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const parsed = parseBankAccountInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  const existing = await findBankAccount(id);
  if (!existing?.bankProfile) {
    return { error: "Bank account not found." };
  }

  try {
    await prisma.account.update({
      where: { id },
      data: {
        name: parsed.name,
        openingValuePaise: parsed.openingValuePaise,
        openingDate: parsed.openingDate,
        bankProfile: {
          update: {
            bankInstitution: parsed.bankInstitution,
            accountType: parsed.accountType,
            bankName: parsed.bankName,
          },
        },
      },
    });
    return { success: true, id };
  } catch (error) {
    console.error("[updateBankAccountRecord]", error);
    return { error: "Could not update bank account." };
  }
}

export async function deleteBankAccountRecord(
  id: string,
): Promise<AccountMutationResult> {
  if (!id.trim()) {
    return { error: "Account not found." };
  }

  const existing = await findBankAccount(id);
  if (!existing) {
    return { error: "Bank account not found." };
  }

  const txCount = await prisma.transaction.count({
    where: { sourceAccountId: id },
  });
  if (txCount > 0) {
    return {
      error: `This account has ${txCount} imported transaction${txCount === 1 ? "" : "s"}. Remove them before deleting.`,
    };
  }

  const sub = await prisma.subCategory.findFirst({
    where: { linkedRecordId: id },
    include: { _count: { select: { transactionLines: true } } },
  });
  if (sub && sub._count.transactionLines > 0) {
    return {
      error: `This account's category has ${sub._count.transactionLines} transaction line${sub._count.transactionLines === 1 ? "" : "s"}. Reassign them before deleting.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (sub) {
        await tx.subCategory.delete({ where: { id: sub.id } });
      }
      await tx.account.delete({ where: { id } });
    });
    return { success: true };
  } catch (error) {
    console.error("[deleteBankAccountRecord]", error);
    return { error: "Could not delete bank account." };
  }
}
