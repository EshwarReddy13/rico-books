import type {
  AssetType,
  BankAccountType,
  BankInstitution,
} from "@/app/generated/prisma/client";

export type AccountCardSummary = {
  id: string;
  name: string;
  assetType: AssetType | null;
  openingValuePaise: number;
  openingDate: string | null;
  bankInstitution?: BankInstitution | null;
  accountType?: BankAccountType | null;
};
