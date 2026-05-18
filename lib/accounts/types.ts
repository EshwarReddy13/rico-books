import type { AssetType } from "@/app/generated/prisma/client";

export type AccountCardSummary = {
  id: string;
  name: string;
  assetType: AssetType | null;
  openingValuePaise: number;
  openingDate: string | null;
};
