import type { EntityFormValues } from "@/lib/entities/types";
import {
  DEFAULT_ENTITY_COLOR,
  normalizeLabelColorHex,
} from "@/lib/colors/palette";

const ENTITY_NAME_MAX = 120;
const ENTITY_DESCRIPTION_MAX = 500;

export type EntityInput = {
  name?: string;
  description?: string;
  colorHex?: string;
};

export function parseEntityInput(
  input: EntityInput,
): EntityFormValues | { error: string } {
  const name = input.name?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const rawColor = input.colorHex?.trim() ?? "";

  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > ENTITY_NAME_MAX) {
    return { error: `Name must be at most ${ENTITY_NAME_MAX} characters.` };
  }
  if (description.length > ENTITY_DESCRIPTION_MAX) {
    return {
      error: `Description must be at most ${ENTITY_DESCRIPTION_MAX} characters.`,
    };
  }

  const colorHex =
    normalizeLabelColorHex(rawColor) ?? DEFAULT_ENTITY_COLOR;

  return { name, description, colorHex };
}
