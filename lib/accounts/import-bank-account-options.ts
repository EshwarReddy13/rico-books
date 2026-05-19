import { getBankInstitutionLabel } from "@/lib/accounts/bank-options";
import type {
  AccountCardSummary,
  ImportBankAccountOption,
} from "@/lib/accounts/types";

export function toImportBankAccountOptions(
  accounts: AccountCardSummary[],
): ImportBankAccountOption[] {
  return accounts.map((account) => ({
    id: account.id,
    nickname: account.name,
    bankLabel: account.bankInstitution
      ? getBankInstitutionLabel(account.bankInstitution)
      : "",
    bankInstitution: account.bankInstitution ?? null,
  }));
}
