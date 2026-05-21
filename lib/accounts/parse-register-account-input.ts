import type { AssetType } from "@/app/generated/prisma/client";

const NAME_MAX = 120;

const NON_BANK_ASSET_TYPES = [
  "vehicle",
  "computer",
  "furniture",
  "equipment",
  "investment",
  "other",
] as const satisfies readonly AssetType[];

export type RegisterAssetInput = {
  name?: string;
  assetType?: string;
  openingBalance?: string;
  openingDate?: string;
};

export type RegisterLiabilityInput = {
  name?: string;
  openingBalance?: string;
  openingDate?: string;
  financedAssetAccountId?: string | null;
};

export type ParsedRegisterAccount = {
  name: string;
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

function parseName(raw: string | undefined): string | { error: string } {
  const name = raw?.trim() ?? "";
  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > NAME_MAX) {
    return { error: `Name must be at most ${NAME_MAX} characters.` };
  }
  return name;
}

export function parseRegisterAssetInput(
  input: RegisterAssetInput,
): (ParsedRegisterAccount & { assetType: AssetType }) | { error: string } {
  const name = parseName(input.name);
  if (typeof name === "object") {
    return name;
  }

  const assetType = input.assetType?.trim() as AssetType | undefined;
  if (
    !assetType ||
    !NON_BANK_ASSET_TYPES.includes(
      assetType as (typeof NON_BANK_ASSET_TYPES)[number],
    )
  ) {
    return { error: "Asset type is required." };
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
    assetType,
    openingValuePaise,
    openingDate: openingDate as Date | null,
  };
}

/** Update asset — type is fixed after creation; only name and opening fields change. */
export function parseRegisterAssetUpdateInput(
  input: RegisterAssetInput,
): ParsedRegisterAccount | { error: string } {
  const name = parseName(input.name);
  if (typeof name === "object") {
    return name;
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
    openingValuePaise,
    openingDate: openingDate as Date | null,
  };
}

export function parseRegisterLiabilityInput(
  input: RegisterLiabilityInput,
): ParsedRegisterAccount | { error: string } {
  const name = parseName(input.name);
  if (typeof name === "object") {
    return name;
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
    openingValuePaise,
    openingDate: openingDate as Date | null,
  };
}

export const REGISTER_ASSET_TYPE_OPTIONS = NON_BANK_ASSET_TYPES.map((value) => ({
  value,
}));
