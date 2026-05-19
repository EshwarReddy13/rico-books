import type {
  BankAccountType,
  BankInstitution,
} from "@/app/generated/prisma/client";

export const BANK_INSTITUTION_OPTIONS: {
  value: BankInstitution;
  label: string;
}[] = [
  { value: "hdfc", label: "HDFC Bank" },
  { value: "icici", label: "ICICI Bank" },
  { value: "sbi", label: "State Bank of India" },
  { value: "axis", label: "Axis Bank" },
  { value: "kotak", label: "Kotak Mahindra Bank" },
  { value: "idfc_first", label: "IDFC First Bank" },
  { value: "yes", label: "Yes Bank" },
  { value: "indusind", label: "IndusInd Bank" },
  { value: "punjab_national", label: "Punjab National Bank" },
  { value: "other", label: "Other" },
];

export const BANK_ACCOUNT_TYPE_OPTIONS: {
  value: BankAccountType;
  label: string;
}[] = [
  { value: "current", label: "Current" },
  { value: "savings", label: "Savings" },
  { value: "salary", label: "Salary" },
  { value: "fd", label: "Fixed deposit" },
  { value: "other", label: "Other" },
];

const institutionLabels = Object.fromEntries(
  BANK_INSTITUTION_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BankInstitution, string>;

const accountTypeLabels = Object.fromEntries(
  BANK_ACCOUNT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BankAccountType, string>;

export function getBankInstitutionLabel(bank: BankInstitution): string {
  return institutionLabels[bank] ?? bank;
}

export function getBankAccountTypeLabel(type: BankAccountType): string {
  return accountTypeLabels[type] ?? type;
}

export function formatBankAccountSubtitle(
  bank: BankInstitution,
  accountType: BankAccountType,
): string {
  return `${getBankInstitutionLabel(bank)} · ${getBankAccountTypeLabel(accountType)}`;
}

export const BANK_INSTITUTION_VALUES = BANK_INSTITUTION_OPTIONS.map(
  (o) => o.value,
);
export const BANK_ACCOUNT_TYPE_VALUES = BANK_ACCOUNT_TYPE_OPTIONS.map(
  (o) => o.value,
);
