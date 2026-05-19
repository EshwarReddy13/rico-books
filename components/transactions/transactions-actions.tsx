"use client";

import { ListOrdered, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImportDialog } from "@/components/dashboard/import-dialog";
import { Button } from "@/components/ui/button";
import { apiDeleteAllTransactions } from "@/lib/transactions/transaction-api";

export function TransactionsActions({
  onCategorizeDialogOpen,
}: {
  onCategorizeDialogOpen?: () => void;
}) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAll() {
    const ok = window.confirm(
      "Delete ALL transactions and import batches? This cannot be undone.",
    );
    if (!ok) {
      return;
    }

    setDeleting(true);
    const result = await apiDeleteAllTransactions();
    setDeleting(false);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={deleting}
          className="h-10 rounded-full border-rose-200 bg-white px-4 text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
          onClick={handleDeleteAll}
        >
          <Trash2 data-icon="inline-start" />
          {deleting ? "Deleting…" : "Delete all (test)"}
        </Button>
        {onCategorizeDialogOpen ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-zinc-200 bg-white px-4 text-zinc-900 shadow-sm hover:bg-zinc-50"
            onClick={onCategorizeDialogOpen}
          >
            <ListOrdered data-icon="inline-start" />
            Categorize pending
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full border-zinc-200 bg-white px-4 text-zinc-900 shadow-sm hover:bg-zinc-50"
          onClick={() => setImportOpen(true)}
        >
          <Upload data-icon="inline-start" />
          Import statements
        </Button>
        <Button
          type="button"
          className="h-10 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800"
        >
          <Plus data-icon="inline-start" />
          Add transaction
        </Button>
      </div>

      {importOpen ? <ImportDialog onClose={() => setImportOpen(false)} /> : null}
    </>
  );
}
