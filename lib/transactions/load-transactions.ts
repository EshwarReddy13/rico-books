import type {
  TransactionListRow,
  TransactionStatus,
  TransactionSummary,
} from "@/lib/transactions/types";
import { formatLineCategoryLabel } from "@/lib/transactions/line-category";
import { transactionDisplayDescription } from "@/lib/transactions/transaction-description";
import { prisma } from "@/lib/prisma";

function formatTransactionDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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
      matchedScheduleRow: {
        select: {
          id: true,
          interestAmountPaise: true,
          principalAmountPaise: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const line = row.lines[0];
    const lineCount = row.lines.length;
    const isEmiSplit =
      lineCount > 1 || row.matchedScheduleRow != null;
    const entityName = line?.entity?.name ?? "—";

    let categoryName: string;
    if (isEmiSplit && lineCount > 1) {
      categoryName = `EMI split (${lineCount} lines)`;
    } else if (line) {
      categoryName = formatLineCategoryLabel(line);
    } else {
      categoryName = "Uncategorized";
    }

    const scheduleInterest = row.matchedScheduleRow
      ? Number(row.matchedScheduleRow.interestAmountPaise)
      : null;
    const schedulePrincipal = row.matchedScheduleRow
      ? Number(row.matchedScheduleRow.principalAmountPaise)
      : null;

    const splitLines = row.lines.map((ln) => {
      const amountPaise = Number(ln.amountPaise);
      let role: "interest" | "principal" = "principal";
      if (scheduleInterest != null && amountPaise === scheduleInterest) {
        role = "interest";
      } else if (schedulePrincipal != null && amountPaise === schedulePrincipal) {
        role = "principal";
      }

      return {
        amountPaise,
        categoryName: formatLineCategoryLabel(ln),
        role,
      };
    });

    const allCategorized = row.lines.every(
      (ln) => ln.mainCategoryId || ln.subCategoryId,
    );

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
      entityInitials: initialsFromDescription(
        transactionDisplayDescription({
          lineDescription: line?.description ?? "",
          rawDescription: row.rawDescription,
        }),
      ),
      description: transactionDisplayDescription({
        lineDescription: line?.description ?? "",
        rawDescription: row.rawDescription,
      }),
      categoryName,
      rawDescription: row.rawDescription,
      importBatchId: row.importBatchId,
      mainCategoryId: line?.mainCategoryId ?? null,
      subCategoryId: line?.subCategoryId ?? null,
      entityId: line?.entityId ?? null,
      lineDescription: line?.description ?? "",
      isCategorized: isEmiSplit
        ? allCategorized
        : Boolean(line?.mainCategoryId || line?.subCategoryId),
      aiConfidence:
        line?.confidence != null ? Number(line.confidence) : null,
      hasAiSuggestion:
        row.status === "pending_review" &&
        !isEmiSplit &&
        line?.confidence != null &&
        Boolean(line?.mainCategoryId || line?.subCategoryId),
      lineCount,
      isEmiSplit,
      splitLines,
    };
  });
}
