import { parseEntityInput, type EntityInput } from "@/lib/entities/parse-entity-input";
import { prisma } from "@/lib/prisma";

export type EntityMutationResult = {
  error?: string;
  success?: boolean;
};

function isFormError(
  parsed: ReturnType<typeof parseEntityInput>,
): parsed is { error: string } {
  return "error" in parsed;
}

export async function createEntityRecord(
  input: EntityInput,
): Promise<EntityMutationResult> {
  const parsed = parseEntityInput(input);
  if (isFormError(parsed)) {
    return parsed;
  }

  try {
    await prisma.entity.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        colorHex: parsed.colorHex,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[createEntityRecord]", error);
    return { error: "Could not create entity. Try again." };
  }
}

export async function updateEntityRecord(
  id: string,
  input: EntityInput,
): Promise<EntityMutationResult> {
  if (!id.trim()) {
    return { error: "Entity not found." };
  }

  const parsed = parseEntityInput(input);
  if (isFormError(parsed)) {
    return parsed;
  }

  try {
    await prisma.entity.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        colorHex: parsed.colorHex,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[updateEntityRecord]", error);
    return { error: "Could not update entity. It may have been deleted." };
  }
}

export async function deleteEntityRecord(
  id: string,
): Promise<EntityMutationResult> {
  if (!id.trim()) {
    return { error: "Entity not found." };
  }

  try {
    await prisma.entity.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[deleteEntityRecord]", error);
    return {
      error:
        "Could not delete entity. It may be in use or already removed.",
    };
  }
}
