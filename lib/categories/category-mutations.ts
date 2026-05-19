import {
  parseMainCategoryInput,
  parseSubCategoryInput,
  type MainCategoryInput,
  type SubCategoryInput,
} from "@/lib/categories/parse-category-input";
import { prisma } from "@/lib/prisma";

export type CategoryMutationResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

function isError(
  parsed: { error: string } | Record<string, unknown>,
): parsed is { error: string } {
  return "error" in parsed;
}

export async function createMainCategoryRecord(
  input: MainCategoryInput,
): Promise<CategoryMutationResult> {
  const parsed = parseMainCategoryInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    const row = await prisma.mainCategory.create({
      data: parsed,
    });
    return { success: true, id: row.id };
  } catch (error) {
    console.error("[createMainCategoryRecord]", error);
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A category with this name already exists."
        : "Could not create main category.";
    return { error: message };
  }
}

export async function updateMainCategoryRecord(
  id: string,
  input: MainCategoryInput,
): Promise<CategoryMutationResult> {
  const parsed = parseMainCategoryInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    await prisma.mainCategory.update({
      where: { id },
      data: parsed,
    });
    return { success: true, id };
  } catch (error) {
    console.error("[updateMainCategoryRecord]", error);
    return { error: "Could not update main category." };
  }
}

export async function deleteMainCategoryRecord(
  id: string,
): Promise<CategoryMutationResult> {
  try {
    const count = await prisma.subCategory.count({
      where: { mainCategoryId: id },
    });
    if (count > 0) {
      return {
        error: `This category has ${count} sub-categor${count === 1 ? "y" : "ies"}. Delete them first.`,
      };
    }
    await prisma.mainCategory.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[deleteMainCategoryRecord]", error);
    return { error: "Could not delete main category." };
  }
}

export async function createSubCategoryRecord(
  input: SubCategoryInput,
): Promise<CategoryMutationResult> {
  const parsed = parseSubCategoryInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    const row = await prisma.subCategory.create({
      data: parsed,
    });
    return { success: true, id: row.id };
  } catch (error) {
    console.error("[createSubCategoryRecord]", error);
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A sub-category with this name already exists under this main category."
        : "Could not create sub-category.";
    return { error: message };
  }
}

export async function updateSubCategoryRecord(
  id: string,
  input: SubCategoryInput,
): Promise<CategoryMutationResult> {
  const parsed = parseSubCategoryInput(input);
  if (isError(parsed)) {
    return parsed;
  }

  try {
    await prisma.subCategory.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        colorHex: parsed.colorHex,
      },
    });
    return { success: true, id };
  } catch (error) {
    console.error("[updateSubCategoryRecord]", error);
    return { error: "Could not update sub-category." };
  }
}

export async function deleteSubCategoryRecord(
  id: string,
): Promise<CategoryMutationResult> {
  try {
    await prisma.subCategory.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[deleteSubCategoryRecord]", error);
    return { error: "Could not delete sub-category." };
  }
}
