/** #RRGGBB — used for entities, main categories, and sub-categories */
export const LABEL_COLOR_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Preset swatches shown in create/edit UI (plus custom color picker) */
export const DEFAULT_LABEL_COLORS = [
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#d97706", // amber
  "#71717a", // zinc
] as const;

export type LabelColorHex = (typeof DEFAULT_LABEL_COLORS)[number] | string;

export const DEFAULT_ENTITY_COLOR = "#6366f1";

export const DEFAULT_SUB_CATEGORY_COLOR = "#94a3b8";

/** Matches seeded main categories — tailwind-500/600 accents from card styles */
export const MAIN_CATEGORY_SEED_COLORS: Record<string, string> = {
  Income: "#10b981",
  Expense: "#f43f5e",
  "Owner Contribution": "#0ea5e9",
  Assets: "#8b5cf6",
  Loans: "#d97706",
  Transfer: "#71717a",
};

export const FALLBACK_LABEL_COLOR = "#71717a";

export function isValidLabelColorHex(value: string): boolean {
  return LABEL_COLOR_HEX_REGEX.test(value);
}

export function normalizeLabelColorHex(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) {
    return isValidLabelColorHex(`#${trimmed}`)
      ? `#${trimmed}`.toLowerCase()
      : null;
  }
  return isValidLabelColorHex(trimmed) ? trimmed.toLowerCase() : null;
}
