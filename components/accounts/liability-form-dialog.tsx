"use client";

import { CalendarDays, FileUp, Scale, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { LoanScheduleImportDialog } from "@/components/loans/loan-schedule-import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiConfirmLoanSchedule,
  apiCreateLiability,
  apiDeleteLiability,
  apiGetLiabilityLoan,
  apiParseLoanDocument,
  apiUpdateLiability,
  apiUpsertLiabilityLoan,
} from "@/lib/accounts/account-api";
import { paiseToRupeeInput } from "@/lib/accounts/format-balance";
import { getAssetTypeLabel } from "@/lib/accounts/labels";
import {
  emptyLoanDraft,
  loanDraftFromExtractHeader,
  loanDraftFromSummary,
  loanPayloadFromDraft,
  type LoanDraft,
} from "@/lib/loans/loan-draft";
import type { LoanScheduleExtractResult } from "@/lib/loans/types";
import type { LoanSummary } from "@/lib/loans/types";
import type { AccountCardSummary, FinancableAssetOption } from "@/lib/accounts/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none",
  "focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40",
  "disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950",
);

type LiabilityDraft = {
  name: string;
  openingBalance: string;
  openingDate: string;
};

function initialLiabilityDraft(account?: AccountCardSummary | null): LiabilityDraft {
  return {
    name: account?.name ?? "",
    openingBalance: account
      ? paiseToRupeeInput(account.openingValuePaise)
      : "",
    openingDate: account?.openingDate ?? "",
  };
}

export function LiabilityFormDialog({
  mode,
  account,
  financableAssets,
  onClose,
  onViewSchedule,
}: {
  mode: "create" | "edit";
  account?: AccountCardSummary | null;
  financableAssets: FinancableAssetOption[];
  onClose: () => void;
  onViewSchedule?: (loanId: string, liabilityName: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [setupAsLoan, setSetupAsLoan] = useState(mode === "edit");
  const [loan, setLoan] = useState<LoanSummary | null>(null);
  const [liabilityDraft, setLiabilityDraft] = useState<LiabilityDraft>(() =>
    initialLiabilityDraft(account),
  );
  const [loanDraft, setLoanDraft] = useState<LoanDraft>(emptyLoanDraft);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    extract: LoanScheduleExtractResult;
    checksum: { ok: boolean; errors: string[] };
  } | null>(null);
  /** Schedule rows to save after loan is created/updated (checksum must pass). */
  const [pendingScheduleExtract, setPendingScheduleExtract] =
    useState<LoanScheduleExtractResult | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const showLoanFields = mode === "create" ? setupAsLoan : true;

  useEffect(() => {
    if (mode !== "edit" || !account?.id) {
      return;
    }
    void apiGetLiabilityLoan(account.id).then((res) => {
      if (res.loan) {
        setLoan(res.loan);
        setLoanDraft(loanDraftFromSummary(res.loan));
        setSetupAsLoan(true);
      }
    });
  }, [mode, account?.id]);

  async function handlePdfFile(file: File) {
    setPdfPending(true);
    setError(null);
    setPdfPreview(null);

    const result = await apiParseLoanDocument(file);
    setPdfPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.extract || !result.checksum) {
      setError("Could not read loan document.");
      return;
    }

    setPdfPreview({ extract: result.extract, checksum: result.checksum });
    setSetupAsLoan(true);
  }

  function applyPdfToForm() {
    if (!pdfPreview) {
      return;
    }
    const headerDraft = loanDraftFromExtractHeader(pdfPreview.extract.header);
    setLoanDraft(headerDraft);
    if (pdfPreview.checksum.ok) {
      setPendingScheduleExtract(pdfPreview.extract);
    } else {
      setPendingScheduleExtract(null);
    }
    setLiabilityDraft((prev) => ({
      ...prev,
      openingBalance: prev.openingBalance || headerDraft.amountFinanced,
      openingDate: prev.openingDate || headerDraft.scheduleGeneratedDate,
      name:
        prev.name ||
        (headerDraft.lender
          ? `${headerDraft.lender} ${headerDraft.loanType || "Loan"}`.trim()
          : prev.name),
    }));
    setPdfPreview(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const liabilityPayload = {
      name: liabilityDraft.name.trim(),
      openingBalance: liabilityDraft.openingBalance.trim(),
      openingDate: liabilityDraft.openingDate.trim(),
    };

    if (!liabilityPayload.name) {
      setPending(false);
      setError("Name is required.");
      return;
    }

    let liabilityId: string | undefined;

    if (mode === "create") {
      const result = await apiCreateLiability(liabilityPayload);
      if (result.error) {
        setPending(false);
        setError(result.error);
        return;
      }
      liabilityId = result.id;
    } else if (!account) {
      setPending(false);
      setError("Liability not found.");
      return;
    } else {
      const result = await apiUpdateLiability(account.id, liabilityPayload);
      if (result.error) {
        setPending(false);
        setError(result.error);
        return;
      }
      liabilityId = account.id;
    }

    let savedLoanId: string | null = loan?.id ?? account?.loanId ?? null;

    if (showLoanFields && liabilityId) {
      const loanResult = await apiUpsertLiabilityLoan(
        liabilityId,
        loanPayloadFromDraft(loanDraft),
      );
      if (loanResult.error) {
        setPending(false);
        setError(loanResult.error);
        return;
      }
      if (loanResult.loan) {
        setLoan(loanResult.loan);
        savedLoanId = loanResult.loan.id;
      }
    }

    if (pendingScheduleExtract && savedLoanId) {
      const scheduleResult = await apiConfirmLoanSchedule(savedLoanId, {
        extract: pendingScheduleExtract,
        replaceExisting: mode === "edit" && (loan?.scheduleRowCount ?? 0) > 0,
      });
      if (scheduleResult.error) {
        setPending(false);
        setError(scheduleResult.error);
        return;
      }
      setPendingScheduleExtract(null);
    }

    setPending(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!account) {
      return;
    }
    setPending(true);
    const result = await apiDeleteLiability(account.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  const title = mode === "create" ? "New liability" : "Edit liability";
  const loanId = loan?.id ?? account?.loanId ?? null;
  const hasPendingSchedule =
    pendingScheduleExtract != null &&
    pendingScheduleExtract.rows.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          aria-label="Close dialog"
          onClick={() => !pending && !pdfPending && onClose()}
        />
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Scale className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Upload the lender PDF to auto-fill loan details and schedule,
                  then review and save.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={pending || pdfPending}
              className="rounded-full p-1.5"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="liability-name">Name</Label>
              <Input
                id="liability-name"
                name="name"
                required
                value={liabilityDraft.name}
                onChange={(e) =>
                  setLiabilityDraft((d) => ({ ...d, name: e.target.value }))
                }
                disabled={pending}
                className="h-11"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="liability-opening-balance">Outstanding (₹)</Label>
                <Input
                  id="liability-opening-balance"
                  name="openingBalance"
                  value={liabilityDraft.openingBalance}
                  onChange={(e) =>
                    setLiabilityDraft((d) => ({
                      ...d,
                      openingBalance: e.target.value,
                    }))
                  }
                  disabled={pending}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="liability-opening-date">As of date</Label>
                <Input
                  id="liability-opening-date"
                  name="openingDate"
                  type="date"
                  value={liabilityDraft.openingDate}
                  onChange={(e) =>
                    setLiabilityDraft((d) => ({
                      ...d,
                      openingDate: e.target.value,
                    }))
                  }
                  disabled={pending}
                  className="h-11"
                />
              </div>
            </div>

            {mode === "create" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={setupAsLoan}
                  onChange={(e) => setSetupAsLoan(e.target.checked)}
                  disabled={pending}
                />
                This is a loan (car loan, personal loan, etc.)
              </label>
            ) : null}

            <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
              <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
                Upload lender PDF
              </p>
              <p className="mt-0.5 text-xs text-violet-700/90 dark:text-violet-300/90">
                AI reads the amortization document once. You confirm the loan
                fields and schedule before anything is saved.
              </p>

              {pdfPreview ? (
                <div className="mt-3 space-y-2">
                  {pdfPreview.checksum.ok ? (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Checksums passed — {pdfPreview.extract.rows.length}{" "}
                      instalments found.
                    </p>
                  ) : (
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-medium">Review warnings before saving:</p>
                      <ul className="mt-1 list-inside list-disc">
                        {pdfPreview.checksum.errors.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                      <p className="mt-1">
                        You can still apply loan header fields; schedule import
                        on save requires passing checksums.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-violet-700 text-white hover:bg-violet-800"
                      onClick={applyPdfToForm}
                    >
                      Apply to form
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPdfPreview(null)}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={pdfPending || pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handlePdfFile(file);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={pdfPending || pending}
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <FileUp className="size-4" data-icon="inline-start" />
                    {pdfPending ? "Reading PDF…" : "Choose lender PDF"}
                  </Button>
                </div>
              )}
            </div>

            {showLoanFields ? (
              <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <legend className="px-1 text-sm font-semibold text-zinc-950">
                  Loan details
                  {hasPendingSchedule ? (
                    <span className="ml-2 font-normal text-violet-600">
                      + schedule on save
                    </span>
                  ) : null}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="lender">Lender</Label>
                    <Input
                      id="lender"
                      value={loanDraft.lender}
                      onChange={(e) =>
                        setLoanDraft((d) => ({ ...d, lender: e.target.value }))
                      }
                      placeholder="HDFC Bank Ltd"
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agreementNo">Agreement no.</Label>
                    <Input
                      id="agreementNo"
                      value={loanDraft.agreementNo}
                      onChange={(e) =>
                        setLoanDraft((d) => ({
                          ...d,
                          agreementNo: e.target.value,
                        }))
                      }
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="loanType">Loan type</Label>
                    <Input
                      id="loanType"
                      value={loanDraft.loanType}
                      onChange={(e) =>
                        setLoanDraft((d) => ({ ...d, loanType: e.target.value }))
                      }
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amountFinanced">Amount financed (₹)</Label>
                    <Input
                      id="amountFinanced"
                      value={loanDraft.amountFinanced}
                      onChange={(e) =>
                        setLoanDraft((d) => ({
                          ...d,
                          amountFinanced: e.target.value,
                        }))
                      }
                      required
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tenure">Tenure (months)</Label>
                    <Input
                      id="tenure"
                      type="number"
                      min={1}
                      value={loanDraft.tenure}
                      onChange={(e) =>
                        setLoanDraft((d) => ({ ...d, tenure: e.target.value }))
                      }
                      required
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="totalPayable">Total payable (₹)</Label>
                    <Input
                      id="totalPayable"
                      value={loanDraft.totalPayable}
                      onChange={(e) =>
                        setLoanDraft((d) => ({
                          ...d,
                          totalPayable: e.target.value,
                        }))
                      }
                      required
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="totalInterest">Total interest (₹)</Label>
                    <Input
                      id="totalInterest"
                      value={loanDraft.totalInterest}
                      onChange={(e) =>
                        setLoanDraft((d) => ({
                          ...d,
                          totalInterest: e.target.value,
                        }))
                      }
                      required
                      disabled={pending}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="financed-asset">Financed asset</Label>
                    <select
                      id="financed-asset"
                      value={loanDraft.financedAssetAccountId}
                      onChange={(e) =>
                        setLoanDraft((d) => ({
                          ...d,
                          financedAssetAccountId: e.target.value,
                        }))
                      }
                      disabled={pending}
                      className={selectClassName}
                    >
                      <option value="">None</option>
                      {financableAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({getAssetTypeLabel(a.assetType)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {mode === "edit" && loanId && !hasPendingSchedule ? (
                  <div className="flex flex-wrap gap-2">
                    {(loan?.scheduleRowCount ?? 0) > 0 && onViewSchedule ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          onViewSchedule(loanId, account?.name ?? liabilityDraft.name)
                        }
                      >
                        <CalendarDays className="size-3.5" aria-hidden />
                        View repayment schedule
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => setScheduleOpen(true)}
                    >
                      {loan?.scheduleRowCount
                        ? `Replace schedule (${loan.scheduleRowCount} rows)`
                        : "Import schedule PDF only"}
                    </Button>
                  </div>
                ) : null}
              </fieldset>
            ) : null}

            {error ? (
              <p className="text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}

            {!confirmDelete ? (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pending || (showLoanFields && !loanDraft.tenure)}
                  className="bg-zinc-950 text-white"
                >
                  {pending
                    ? "Saving…"
                    : hasPendingSchedule
                      ? "Save loan + schedule"
                      : mode === "create"
                        ? "Create"
                        : "Save"}
                </Button>
              </div>
            ) : null}
          </form>

          {mode === "edit" && account && !confirmDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="mt-4"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
              Delete liability
            </Button>
          ) : null}

          {confirmDelete && account ? (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void handleDelete()}>
                Confirm delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {scheduleOpen && loanId && account ? (
        <LoanScheduleImportDialog
          loanId={loanId}
          liabilityName={account.name}
          onClose={() => {
            setScheduleOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
