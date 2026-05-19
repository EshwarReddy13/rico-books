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

/** Tailwind classes for bank name tags in the import account picker. */
export const BANK_INSTITUTION_TAG_CLASS: Record<BankInstitution, string> = {
  hdfc: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  icici: "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300",
  sbi: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  axis: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  kotak: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-300",
  idfc_first: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  yes: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  indusind: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300",
  punjab_national: "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function getBankInstitutionTagClass(
  bank: BankInstitution | null,
): string {
  if (!bank) {
    return BANK_INSTITUTION_TAG_CLASS.other;
  }
  return BANK_INSTITUTION_TAG_CLASS[bank] ?? BANK_INSTITUTION_TAG_CLASS.other;
}
