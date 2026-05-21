import {
  fetchLinesThrough,
  filterLines,
  sumLineAmounts,
} from "@/lib/metrics/line-aggregate";
import type { OverviewCardKind } from "@/lib/metrics/overview-transaction-filter";
import {
  formatOverviewDateRange,
  resolveOverviewPeriodRange,
  type OverviewCustomRange,
  type OverviewPeriodPreset,
} from "@/lib/metrics/overview-period";
import { formatTxnDate } from "@/lib/metrics/period-range";
import { formatLineCategoryLabel } from "@/lib/transactions/line-category";

export type OverviewTransactionItem = {
  lineId: string;
  transactionId: string;
  date: string;
  description: string;
  categoryLabel: string;
  entityName: string;
  amountPaise: number;
  pnlSign: "income" | "expense";
  direction: "debit" | "credit";
};

export type OverviewTransactionsResult = {
  kind: OverviewCardKind;
  periodLabel: string;
  dateRangeLabel: string;
  totalPaise: number;
  incomePaise: number;
  expensePaise: number;
  items: OverviewTransactionItem[];
};

export async function listOverviewTransactions(
  entityId: string | null,
  preset: OverviewPeriodPreset,
  kind: OverviewCardKind,
  custom?: OverviewCustomRange | null,
): Promise<OverviewTransactionsResult | { error: string }> {
  const now = new Date();
  const resolved = resolveOverviewPeriodRange(preset, now, custom);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const allLines = await fetchLinesThrough(now);
  const baseFilter = {
    start: resolved.start,
    end: resolved.end,
    entityId,
    confirmedOnly: true,
    pnlOnly: true,
  } as const;

  let lines = filterLines(allLines, baseFilter);

  if (kind === "income") {
    lines = lines.filter((l) => l.main?.pnlSign === "income");
  } else if (kind === "expense") {
    lines = lines.filter((l) => l.main?.pnlSign === "expense");
  }

  lines.sort(
    (a, b) =>
      b.txnDate.getTime() - a.txnDate.getTime() ||
      b.id.localeCompare(a.id),
  );

  const incomePaise = sumLineAmounts(
    lines.filter((l) => l.main?.pnlSign === "income"),
  );
  const expensePaise = sumLineAmounts(
    lines.filter((l) => l.main?.pnlSign === "expense"),
  );

  const items: OverviewTransactionItem[] = lines.map((line) => ({
    lineId: line.id,
    transactionId: line.transactionId,
    date: formatTxnDate(line.txnDate),
    description: line.description || line.txnDescription,
    categoryLabel: line.main ? formatLineCategoryLabel(line) : "Uncategorized",
    entityName: line.entityName ?? "Unassigned",
    amountPaise: line.amountPaise,
    pnlSign: line.main?.pnlSign === "income" ? "income" : "expense",
    direction: line.txnDirection,
  }));

  const totalPaise =
    kind === "profit"
      ? incomePaise - expensePaise
      : kind === "income"
        ? incomePaise
        : expensePaise;

  return {
    kind,
    periodLabel: resolved.label,
    dateRangeLabel: formatOverviewDateRange(resolved),
    totalPaise,
    incomePaise,
    expensePaise,
    items,
  };
}
