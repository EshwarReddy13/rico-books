import { TransactionsClient } from "@/components/transactions/transactions-client";
import { loadAllSubCategoriesGrouped } from "@/lib/categories/load-sub-categories";
import { loadMainCategories } from "@/lib/categories/load-main-categories";
import { loadEntities } from "@/lib/entities/load-entities";
import {
  loadTransactionSummary,
  loadTransactions,
} from "@/lib/transactions/load-transactions";

export async function TransactionsPage() {
  const [transactions, summary, mains, subsByMain, entities] = await Promise.all([
    loadTransactions(),
    loadTransactionSummary(),
    loadMainCategories(),
    loadAllSubCategoriesGrouped(),
    loadEntities(),
  ]);

  return (
    <TransactionsClient
      transactions={transactions}
      summary={summary}
      mains={mains}
      subsByMain={subsByMain}
      entities={entities}
    />
  );
}
