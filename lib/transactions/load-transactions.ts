import type {
  TransactionListRow,
  TransactionStatus,
  TransactionSummary,
} from "@/lib/transactions/types";
import { formatLineCategoryLabel } from "@/lib/transactions/line-category";
import { prisma } from "@/lib/prisma";

function formatTransactionDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function initialsFromDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.slice(0, 2).toUpperCase();
}

async function aggregateBucket(
  status?: TransactionStatus,
): Promise<{ count: number; totalPaise: number }> {
  const where = status ? { status } : {};

  const [count, aggregate] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: { amountPaise: true },
    }),
  ]);

  return {
    count,
    totalPaise: Number(aggregate._sum.amountPaise ?? BigInt(0)),
  };
}

export async function loadTransactionSummary(): Promise<TransactionSummary> {
  const [all, pendingReview, confirmed] = await Promise.all([
    aggregateBucket(),
    aggregateBucket("pending_review"),
    aggregateBucket("confirmed"),
  ]);

  return { all, pendingReview, confirmed };
}

export async function loadTransactions(): Promise<TransactionListRow[]> {
  const rows = await prisma.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      sourceAccount: { select: { name: true } },
      lines: {
        take: 1,
        orderBy: { createdAt: "asc" },
        include: {
          entity: { select: { name: true } },
          mainCategory: { select: { id: true, name: true } },
          subCategory: {
            select: {
              id: true,
              name: true,
              mainCategoryId: true,
              mainCategory: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const line = row.lines[0];
    const entityName = line?.entity?.name ?? "—";
    const categoryName = line
      ? formatLineCategoryLabel(line)
      : "Uncategorized";

    return {
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      dateLabel: formatTransactionDate(row.date),
      status: row.status,
      amountPaise: Number(row.amountPaise),
      direction: row.direction,
      referenceNo: row.referenceNo || "—",
      accountName: row.sourceAccount.name,
      entityName,
      entityInitials: line?.entity?.name
        ? initialsFromName(line.entity.name)
        : initialsFromDescription(row.rawDescription),
      categoryName,
      rawDescription: row.rawDescription,
      importBatchId: row.importBatchId,
      mainCategoryId: line?.mainCategoryId ?? null,
      subCategoryId: line?.subCategoryId ?? null,
      entityId: line?.entityId ?? null,
      lineDescription: line?.description ?? "",
      isCategorized: Boolean(line?.mainCategoryId || line?.subCategoryId),
      aiConfidence:
        line?.confidence != null ? Number(line.confidence) : null,
      hasAiSuggestion:
        row.status === "pending_review" &&
        line?.confidence != null &&
        Boolean(line?.mainCategoryId || line?.subCategoryId),
    };
  });
}
