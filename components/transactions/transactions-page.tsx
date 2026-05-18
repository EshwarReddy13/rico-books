import { TransactionsActions } from "@/components/transactions/transactions-actions";
import { TransactionsSummaryCards } from "@/components/transactions/transactions-summary-cards";
import { TransactionsTable } from "@/components/transactions/transactions-table";

export function TransactionsPage() {
  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-6">
      <TransactionsActions />
      <TransactionsSummaryCards />
      <TransactionsTable />
    </div>
  );
}
