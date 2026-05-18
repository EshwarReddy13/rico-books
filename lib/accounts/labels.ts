import type { AssetType } from "@/app/generated/prisma/client";

const assetTypeLabels: Record<AssetType, string> = {
  bank: "Bank account",
  vehicle: "Vehicle",
  computer: "Computer",
  furniture: "Furniture",
  equipment: "Equipment",
  investment: "Investment",
  other: "Other asset",
};

export function getAssetTypeLabel(assetType: AssetType | null): string {
  if (!assetType) {
    return "Liability";
  }
  return assetTypeLabels[assetType];
}
