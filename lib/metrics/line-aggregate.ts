import { prisma } from "@/lib/prisma";
import { resolveLineMainCategoryId } from "@/lib/transactions/line-category";
import { paiseToNumber } from "@/lib/metrics/bigint";

export type MainCategoryMeta = {
  id: string;
  name: string;
  kind: "pnl" | "balance_sheet";
  pnlSign: "income" | "expense" | null;
};

export type FetchedLine = {
  id: string;
  transactionId: string;
  amountPaise: number;
  entityId: string | null;
  entityName: string | null;
  description: string;
  subCategoryId: string | null;
  subCategoryName: string | null;
  subColorHex: string | null;
  main: MainCategoryMeta | null;
  txnDate: Date;
  txnStatus: "confirmed" | "pending_review";
  txnDescription: string;
  txnAmountPaise: number;
  txnDirection: "debit" | "credit";
};

export function lineMatchesEntity(
  lineEntityId: string | null,
  entityId: string | null,
): boolean {
  if (!entityId) {
    return true;
  }
  return lineEntityId === entityId || lineEntityId === null;
}

export function txnInRange(
  date: Date,
  start: Date,
  end: Date,
): boolean {
  return date >= start && date <= end;
}

export async function fetchLinesThrough(end: Date): Promise<FetchedLine[]> {
  const rows = await prisma.transactionLine.findMany({
    where: {
      transaction: {
        date: { lte: end },
      },
    },
    include: {
      transaction: {
        select: {
          id: true,
          date: true,
          status: true,
          rawDescription: true,
          amountPaise: true,
          direction: true,
        },
      },
      mainCategory: {
        select: { id: true, name: true, kind: true, pnlSign: true },
      },
      subCategory: {
        select: {
          id: true,
          name: true,
          colorHex: true,
          mainCategory: {
            select: { id: true, name: true, kind: true, pnlSign: true },
          },
        },
      },
      entity: { select: { id: true, name: true } },
    },
    orderBy: { transaction: { date: "desc" } },
  });

  return rows.map((row) => {
    const mainId = resolveLineMainCategoryId(row);
    const mainFromSub = row.subCategory?.mainCategory;
    const mainFromLine = row.mainCategory;
    const mainRaw = mainFromSub ?? mainFromLine;

    const main: MainCategoryMeta | null = mainRaw
      ? {
          id: mainRaw.id,
          name: mainRaw.name,
          kind: mainRaw.kind,
          pnlSign: mainRaw.pnlSign,
        }
      : null;

    return {
      id: row.id,
      transactionId: row.transactionId,
      amountPaise: paiseToNumber(row.amountPaise),
      entityId: row.entityId,
      entityName: row.entity?.name ?? null,
      description: row.description.trim() || row.transaction.rawDescription,
      subCategoryId: row.subCategoryId,
      subCategoryName: row.subCategory?.name ?? null,
      subColorHex: row.subCategory?.colorHex ?? null,
      main,
      txnDate: row.transaction.date,
      txnStatus: row.transaction.status,
      txnDescription: row.transaction.rawDescription,
      txnAmountPaise: paiseToNumber(row.transaction.amountPaise),
      txnDirection: row.transaction.direction,
    };
  });
}


export function filterLines(
  lines: FetchedLine[],
  opts: {
    start: Date;
    end: Date;
    entityId?: string | null;
    mainCategoryId?: string | null;
    confirmedOnly?: boolean;
    pnlOnly?: boolean;
    pnlSign?: "income" | "expense";
  },
): FetchedLine[] {
  return lines.filter((line) => {
    if (!txnInRange(line.txnDate, opts.start, opts.end)) {
      return false;
    }
    if (!lineMatchesEntity(line.entityId, opts.entityId ?? null)) {
      return false;
    }
    if (opts.confirmedOnly && line.txnStatus !== "confirmed") {
      return false;
    }
    if (!line.main) {
      return false;
    }
    if (opts.mainCategoryId && line.main.id !== opts.mainCategoryId) {
      return false;
    }
    if (opts.pnlOnly && line.main.kind !== "pnl") {
      return false;
    }
    if (opts.pnlSign && line.main.pnlSign !== opts.pnlSign) {
      return false;
    }
    return true;
  });
}

export function sumLineAmounts(lines: FetchedLine[]): number {
  return lines.reduce((sum, line) => sum + line.amountPaise, 0);
}

export function computePnlFromLines(lines: FetchedLine[]): {
  incomePaise: number;
  expensePaise: number;
  profitPaise: number;
} {
  let incomePaise = 0;
  let expensePaise = 0;

  for (const line of lines) {
    if (!line.main || line.main.kind !== "pnl") {
      continue;
    }
    if (line.main.pnlSign === "income") {
      incomePaise += line.amountPaise;
    } else if (line.main.pnlSign === "expense") {
      expensePaise += line.amountPaise;
    }
  }

  return {
    incomePaise,
    expensePaise,
    profitPaise: incomePaise - expensePaise,
  };
}

export function trendFromTotals(
  current: number,
  previous: number,
): { trend: string; trendUp: boolean } {
  if (previous === 0) {
    if (current === 0) {
      return { trend: "—", trendUp: true };
    }
    return { trend: "New", trendUp: true };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return { trend: `${sign}${pct}%`, trendUp: pct >= 0 };
}
