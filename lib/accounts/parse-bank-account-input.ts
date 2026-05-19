import {
  BANK_ACCOUNT_TYPE_VALUES,
  BANK_INSTITUTION_VALUES,
  getBankInstitutionLabel,
} from "@/lib/accounts/bank-options";
import type {
  BankAccountType,
  BankInstitution,
} from "@/app/generated/prisma/client";

const NAME_MAX = 120;

export type BankAccountInput = {
  name?: string;
  bankInstitution?: string;
  accountType?: string;
  openingBalance?: string;
  openingDate?: string;
};

export type ParsedBankAccount = {
  name: string;
  bankInstitution: BankInstitution;
  accountType: BankAccountType;
  bankName: string;
  openingValuePaise: bigint;
  openingDate: Date | null;
};

function parseOpeningBalancePaise(
  raw: string | undefined,
): bigint | { error: string } {
  const trimmed = (raw ?? "").trim().replace(/,/g, "");
  if (!trimmed) {
    return BigInt(0);
  }

  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) {
    return { error: "Opening balance must be a valid number." };
  }

  return BigInt(Math.round(amount * 100));
}

function parseOpeningDate(
  raw: string | undefined,
): Date | null | { error: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { error: "Opening date is invalid." };
  }

  return date;
}

function parseEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fieldLabel: string,
): T | { error: string } {
  const value = raw?.trim() as T | undefined;
  if (!value || !allowed.includes(value)) {
    return { error: `${fieldLabel} is required.` };
  }
  return value;
}

export function parseBankAccountInput(
  input: BankAccountInput,
): ParsedBankAccount | { error: string } {
  const name = input.name?.trim() ?? "";

  if (!name) {
    return { error: "Nickname is required." };
  }
  if (name.length > NAME_MAX) {
    return { error: `Nickname must be at most ${NAME_MAX} characters.` };
  }

  const bankInstitution = parseEnum(
    input.bankInstitution,
    BANK_INSTITUTION_VALUES,
    "Bank",
  );
  if (typeof bankInstitution === "object" && "error" in bankInstitution) {
    return bankInstitution;
  }

  const accountType = parseEnum(
    input.accountType,
    BANK_ACCOUNT_TYPE_VALUES,
    "Account type",
  );
  if (typeof accountType === "object" && "error" in accountType) {
    return accountType;
  }

  const openingValuePaise = parseOpeningBalancePaise(input.openingBalance);
  if (typeof openingValuePaise === "object" && "error" in openingValuePaise) {
    return openingValuePaise;
  }

  const openingDate = parseOpeningDate(input.openingDate);
  if (typeof openingDate === "object" && openingDate && "error" in openingDate) {
    return openingDate;
  }

  return {
    name,
    bankInstitution,
    accountType,
    bankName: getBankInstitutionLabel(bankInstitution),
    openingValuePaise,
    openingDate: openingDate as Date | null,
  };
}
