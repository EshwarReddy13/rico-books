import { Suspense } from "react";

import { TransactionsPage } from "@/components/transactions/transactions-page";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-500">Loading transactions…</p>
      }
    >
      <TransactionsPage />
    </Suspense>
  );
}
