"use client";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";

import { ImportDialog } from "@/components/dashboard/import-dialog";
import { Button } from "@/components/ui/button";

export function TransactionsActions() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
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
