import { TransactionsClient } from "@/components/transactions/transactions-client";
import { loadAllSubCategoriesGrouped } from "@/lib/categories/load-sub-categories";
import { loadMainCategories } from "@/lib/categories/load-main-categories";
import { loadEntities } from "@/lib/entities/load-entities";
import { repairEmiSplitLines } from "@/lib/loans/repair-emi-split-lines";
import { loadTransactions } from "@/lib/transactions/load-transactions";

export async function TransactionsPage() {
  await repairEmiSplitLines();

  const [transactions, mains, subsByMain, entities] = await Promise.all([
    loadTransactions(),
    loadMainCategories(),
    loadAllSubCategoriesGrouped(),
    loadEntities(),
  ]);

  return (
    <TransactionsClient
      transactions={transactions}
      mains={mains}
      subsByMain={subsByMain}
      entities={entities}
    />
  );
}
