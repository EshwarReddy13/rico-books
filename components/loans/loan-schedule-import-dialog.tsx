"use client";

import { FileUp, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  apiConfirmLoanSchedule,
  apiParseLoanSchedulePdf,
} from "@/lib/accounts/account-api";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { LoanScheduleExtractResult } from "@/lib/loans/types";

export function LoanScheduleImportDialog({
  loanId,
  liabilityName,
  onClose,
}: {
  loanId: string;
  liabilityName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extract, setExtract] = useState<LoanScheduleExtractResult | null>(null);
  const [checksumErrors, setChecksumErrors] = useState<string[]>([]);

  async function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setExtract(null);
    setChecksumErrors([]);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setPending(false);
      setError("Choose a PDF file.");
      return;
    }

    const result = await apiParseLoanSchedulePdf(loanId, file);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.extract) {
      setError("Could not extract schedule.");
      return;
    }

    setExtract(result.extract as LoanScheduleExtractResult);
    if (result.checksum && !result.checksum.ok) {
      setChecksumErrors(result.checksum.errors);
    }
  }

  async function handleConfirm() {
    if (!extract) {
      return;
    }
    setPending(true);
    setError(null);

    const result = await apiConfirmLoanSchedule(loanId, { extract });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Import loan schedule
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{liabilityName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {!extract ? (
            <form onSubmit={handleParse} className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Upload the lender&apos;s amortization PDF. AI extracts the table;
                code verifies totals before saving.
              </p>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-600">
                <FileUp className="size-8 text-zinc-400" aria-hidden />
                <span className="text-sm font-medium">Choose PDF</span>
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  disabled={pending}
                  className="sr-only"
                />
              </label>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Reading PDF…" : "Extract schedule"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {checksumErrors.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-medium">Checksum warnings</p>
                  <ul className="mt-1 list-inside list-disc">
                    {checksumErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Checksums passed — {extract.rows.length} instalments extracted.
                </p>
              )}

              <div className="max-h-48 overflow-auto rounded-lg border border-zinc-200 text-xs dark:border-zinc-700">
                <table className="w-full">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Due</th>
                      <th className="px-2 py-1 text-right">EMI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extract.rows.slice(0, 12).map((row) => (
                      <tr key={row.installmentNo} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-2 py-1">{row.installmentNo}</td>
                        <td className="px-2 py-1">{row.dueDate}</td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {formatInrFromPaise(row.emiAmountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {extract.rows.length > 12 ? (
                  <p className="border-t border-zinc-100 px-2 py-1 text-zinc-500 dark:border-zinc-800">
                    + {extract.rows.length - 12} more rows
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setExtract(null);
                    setChecksumErrors([]);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={pending || checksumErrors.length > 0}
                  className="flex-1 bg-zinc-950 text-white"
                  onClick={() => void handleConfirm()}
                >
                  {pending ? "Saving…" : "Confirm schedule"}
                </Button>
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-3 text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
