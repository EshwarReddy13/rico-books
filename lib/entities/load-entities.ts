import type { EntitySummary } from "@/lib/entities/types";
import { prisma } from "@/lib/prisma";

export async function loadEntities(): Promise<EntitySummary[]> {
  const rows = await prisma.entity.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      colorHex: true,
    },
  });

  return rows;
}
