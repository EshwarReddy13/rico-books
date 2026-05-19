import {
  DEFAULT_SUB_CATEGORY_COLOR,
  FALLBACK_LABEL_COLOR,
  normalizeLabelColorHex,
} from "@/lib/colors/palette";

const NAME_MAX = 120;
const DESCRIPTION_MAX = 500;

export type MainCategoryInput = {
  name?: string;
  description?: string;
  colorHex?: string;
  kind?: string;
  pnlSign?: string | null;
};

export type SubCategoryInput = {
  name?: string;
  description?: string;
  colorHex?: string;
  mainCategoryId?: string;
};

export type ParsedMainCategory = {
  name: string;
  description: string;
  colorHex: string;
  kind: "pnl" | "balance_sheet";
  pnlSign: "income" | "expense" | null;
};

export type ParsedSubCategory = {
  name: string;
  description: string;
  colorHex: string;
  mainCategoryId: string;
};

function parseColor(raw: string | undefined, fallback: string) {
  return normalizeLabelColorHex(raw?.trim() ?? "") ?? fallback;
}

export function parseMainCategoryInput(
  input: MainCategoryInput,
): ParsedMainCategory | { error: string } {
  const name = input.name?.trim() ?? "";
  const description = input.description?.trim() ?? "";

  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > NAME_MAX) {
    return { error: `Name must be at most ${NAME_MAX} characters.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `Description must be at most ${DESCRIPTION_MAX} characters.` };
  }

  const kind = input.kind === "balance_sheet" ? "balance_sheet" : "pnl";
  let pnlSign: "income" | "expense" | null = null;

  if (kind === "pnl") {
    if (input.pnlSign === "expense") {
      pnlSign = "expense";
    } else {
      pnlSign = "income";
    }
  }

  return {
    name,
    description,
    colorHex: parseColor(input.colorHex, FALLBACK_LABEL_COLOR),
    kind,
    pnlSign,
  };
}

export function parseSubCategoryInput(
  input: SubCategoryInput,
): ParsedSubCategory | { error: string } {
  const name = input.name?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const mainCategoryId = input.mainCategoryId?.trim() ?? "";

  if (!mainCategoryId) {
    return { error: "Main category is required." };
  }
  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > NAME_MAX) {
    return { error: `Name must be at most ${NAME_MAX} characters.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `Description must be at most ${DESCRIPTION_MAX} characters.` };
  }

  return {
    name,
    description,
    colorHex: parseColor(input.colorHex, DEFAULT_SUB_CATEGORY_COLOR),
    mainCategoryId,
  };
}
