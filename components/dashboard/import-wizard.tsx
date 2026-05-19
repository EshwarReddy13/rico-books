"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ImportPreviewTable } from "@/components/dashboard/import/import-preview-table";
import { useImportBankAccounts } from "@/components/dashboard/import-bank-accounts-context";
import { ImportBankAccountPicker } from "@/components/dashboard/import-bank-account-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { readStoredEntityId } from "@/lib/dashboard/selected-entity";
import {
  apiConfirmImport,
  apiParseImport,
  downloadImportTemplate,
} from "@/lib/import/import-api";
import type { ImportConfirmRow } from "@/lib/import/types";
import { cn } from "@/lib/utils";

type Step = "upload" | "preview" | "done";

export function ImportWizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const bankAccounts = useImportBankAccounts();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportConfirmRow[]>([]);
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[]
  >([]);
  const [doneSummary, setDoneSummary] = useState<{
    importedCount: number;
    skippedDuplicateCount: number;
    batchId?: string;
  } | null>(null);

  useEffect(() => {
    if (bankAccounts.length === 1) {
      setAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  function handleFile(next: File | undefined) {
    if (!next) {
      return;
    }
    setFile(next);
    setFileName(next.name);
    setError(null);
  }

  async function handleContinueToPreview() {
    if (!accountId || !file) {
      setError("Select a bank account and choose a file.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await apiParseImport(accountId, file);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const confirmRows: ImportConfirmRow[] = result.rows.map((row) => ({
      ...row,
      include: !row.isDuplicate,
    }));

    setRows(confirmRows);
    setParseErrors(result.parseErrors);
    setStep("preview");

    if (confirmRows.length === 0) {
      setError(
        result.parseErrors.length > 0
          ? "No valid rows to import. Fix errors in your file and try again."
          : "No transactions found in file.",
      );
    }
  }

  async function handleConfirmImport(andCategorize: boolean) {
    if (!accountId || !fileName) {
      return;
    }

    setPending(true);
    setError(null);

    const result = await apiConfirmImport({
      accountId,
      fileName,
      rows,
      entityId: readStoredEntityId(),
    });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const summary = {
      importedCount: result.importedCount ?? 0,
      skippedDuplicateCount: result.skippedDuplicateCount ?? 0,
      batchId: result.batchId,
    };

    if (andCategorize && result.batchId && summary.importedCount > 0) {
      router.refresh();
      onClose();
      router.push(
        `/transactions?prompt=1&batch=${encodeURIComponent(result.batchId)}`,
      );
      return;
    }

    setDoneSummary(summary);
    setStep("done");
    router.refresh();
  }

  const canContinue = Boolean(accountId && file && bankAccounts.length > 0);
  const selectedCount = rows.filter((r) => r.include).length;
  const wide = step === "preview";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-xl sm:rounded-3xl dark:bg-zinc-900",
          wide ? "max-w-3xl" : "max-w-md",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              {step === "done" ? (
                <CheckCircle2 className="size-5" aria-hidden />
              ) : (
                <Upload className="size-5" aria-hidden />
              )}
            </span>
            <div>
              <h2
                id="import-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {step === "upload" && "Import statement"}
                {step === "preview" && "Review transactions"}
                {step === "done" && "Import complete"}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {step === "upload" &&
                  "HDFC-style columns (Date, Narration, Withdrawal, Deposit…)."}
                {step === "preview" &&
                  "Uncheck any rows you do not want to import."}
                {step === "done" &&
                  "Saved as pending review — categorize them next."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {step === "upload" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="import-dialog-account">Bank account</Label>
                {bankAccounts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                    No bank accounts yet.{" "}
                    <Link
                      href="/assets"
                      className="font-medium text-zinc-950 underline-offset-2 hover:underline dark:text-zinc-50"
                      onClick={onClose}
                    >
                      Add one in Assets
                    </Link>
                    .
                  </p>
                ) : (
                  <ImportBankAccountPicker
                    accounts={bankAccounts}
                    value={accountId}
                    onChange={setAccountId}
                  />
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-2"
                onClick={downloadImportTemplate}
              >
                <Download className="size-4" aria-hidden />
                Download import template
              </Button>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={bankAccounts.length === 0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                  bankAccounts.length === 0 && "cursor-not-allowed opacity-50",
                  dragOver
                    ? "border-violet-400 bg-violet-50/50"
                    : "border-neutral-200 bg-zinc-50/80 hover:border-neutral-300 dark:border-zinc-700 dark:bg-zinc-800/50",
                )}
              >
                <FileSpreadsheet className="size-8 text-zinc-400" aria-hidden />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {fileName ?? "Drop statement or template file"}
                </span>
                <span className="text-xs text-zinc-500">.xls, .xlsx, .csv</span>
              </button>
            </div>
          ) : null}

          {step === "preview" ? (
            <div className="space-y-3">
              <ImportPreviewTable rows={rows} onChange={setRows} />
              {parseErrors.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-medium">
                    {parseErrors.length} row
                    {parseErrors.length === 1 ? "" : "s"} skipped
                  </p>
                  <ul className="mt-1 max-h-24 list-inside list-disc overflow-auto">
                    {parseErrors.slice(0, 8).map((err) => (
                      <li key={err.row}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {parseErrors.length > 8 ? (
                      <li>…and {parseErrors.length - 8} more</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "done" && doneSummary ? (
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {doneSummary.importedCount}
                </span>{" "}
                transaction
                {doneSummary.importedCount === 1 ? "" : "s"} imported as{" "}
                <span className="font-medium">pending review</span>.
              </p>
              {doneSummary.skippedDuplicateCount > 0 ? (
                <p>
                  {doneSummary.skippedDuplicateCount} duplicate
                  {doneSummary.skippedDuplicateCount === 1 ? "" : "s"} skipped
                  (already in your books).
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p
              className="mt-3 text-sm text-rose-600 dark:text-rose-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:justify-end sm:p-6">
          {step === "upload" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onClose}
                className="h-11 sm:min-w-[6rem]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canContinue || pending}
                onClick={handleContinueToPreview}
                className="h-11 bg-zinc-950 text-white hover:bg-zinc-900 sm:min-w-[8rem]"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Reading file…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          ) : null}

          {step === "preview" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setStep("upload");
                  setError(null);
                }}
                className="h-11 sm:min-w-[6rem]"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || selectedCount === 0}
                onClick={() => handleConfirmImport(false)}
                className="h-11 sm:min-w-[9rem]"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  "Import for later"
                )}
              </Button>
              <Button
                type="button"
                disabled={pending || selectedCount === 0}
                onClick={() => handleConfirmImport(true)}
                className="h-11 bg-zinc-950 text-white hover:bg-zinc-900 sm:min-w-[10rem]"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Importing…
                  </>
                ) : (
                  `Import & categorize (${selectedCount})`
                )}
              </Button>
            </>
          ) : null}

          {step === "done" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 sm:min-w-[8rem]"
              >
                Skip categorizing
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  router.push("/transactions");
                }}
                className="h-11 sm:min-w-[8rem]"
              >
                View transactions
              </Button>
              {doneSummary &&
              doneSummary.importedCount > 0 &&
              doneSummary.batchId ? (
                <Button
                  type="button"
                  className="h-11 bg-zinc-950 text-white hover:bg-zinc-900 sm:min-w-[10rem]"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/transactions?prompt=1&batch=${encodeURIComponent(doneSummary.batchId!)}`,
                    );
                  }}
                >
                  Categorize now
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
