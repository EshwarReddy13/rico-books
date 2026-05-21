"use client";

import { Car, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiCreateRegisterAsset,
  apiDeleteRegisterAsset,
  apiUpdateRegisterAsset,
} from "@/lib/accounts/account-api";
import { paiseToRupeeInput } from "@/lib/accounts/format-balance";
import { getAssetTypeLabel } from "@/lib/accounts/labels";
import { REGISTER_ASSET_TYPE_OPTIONS } from "@/lib/accounts/parse-register-account-input";
import type { AccountCardSummary } from "@/lib/accounts/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none",
  "focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40",
  "disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950",
);

export function RegisterAssetFormDialog({
  mode,
  account,
  onClose,
}: {
  mode: "create" | "edit";
  account?: AccountCardSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get("name") as string).trim(),
      ...(mode === "create"
        ? { assetType: (formData.get("assetType") as string) ?? "" }
        : {}),
      openingBalance: ((formData.get("openingBalance") as string) ?? "").trim(),
      openingDate: ((formData.get("openingDate") as string) ?? "").trim(),
    };

    let result;
    if (mode === "create") {
      result = await apiCreateRegisterAsset(payload);
    } else if (!account) {
      setPending(false);
      setError("Asset not found.");
      return;
    } else {
      result = await apiUpdateRegisterAsset(account.id, payload);
    }

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!account) {
      return;
    }
    setPending(true);
    setError(null);

    const result = await apiDeleteRegisterAsset(account.id);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  const title = mode === "create" ? "New asset" : "Edit asset";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-asset-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <Car className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="register-asset-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {mode === "create"
                  ? "Creates the asset and a matching Assets sub-category for categorization."
                  : "Updates the asset and syncs the linked sub-category name."}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              name="name"
              required
              maxLength={120}
              defaultValue={account?.name ?? ""}
              placeholder="e.g. VW Virtus"
              disabled={pending}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-type">Asset type</Label>
            {mode === "edit" && account?.assetType ? (
              <div
                id="asset-type"
                className={cn(
                  selectClassName,
                  "flex items-center text-zinc-600 dark:text-zinc-400",
                )}
              >
                {getAssetTypeLabel(account.assetType)}
              </div>
            ) : (
              <select
                id="asset-type"
                name="assetType"
                required
                disabled={pending}
                defaultValue={account?.assetType ?? "vehicle"}
                className={selectClassName}
              >
                {REGISTER_ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {getAssetTypeLabel(opt.value)}
                  </option>
                ))}
              </select>
            )}
            {mode === "edit" ? (
              <p className="text-xs text-zinc-500">
                Asset type cannot be changed after creation.
              </p>
            ) : null}
          </div>

          {mode === "edit" &&
          (account?.linkedLoanName ||
            (account?.downPaymentCount ?? 0) > 0 ||
            account?.costIsComputed) ? (
            <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
              Cost and as-of date update automatically when you link a loan or
              confirm a down payment to this asset. Refresh the page if values
              look stale.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="asset-opening-balance">Cost / value (₹)</Label>
              <Input
                id="asset-opening-balance"
                name="openingBalance"
                type="text"
                inputMode="decimal"
                placeholder="0"
                defaultValue={
                  account ? paiseToRupeeInput(account.openingValuePaise) : ""
                }
                disabled={pending}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-opening-date">As of date</Label>
              <Input
                id="asset-opening-date"
                name="openingDate"
                type="date"
                defaultValue={account?.openingDate ?? ""}
                disabled={pending}
                className="h-11"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          ) : null}

          {!confirmDelete ? (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
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
                type="submit"
                disabled={pending}
                className="h-11 bg-zinc-950 text-white hover:bg-zinc-900 sm:min-w-[6rem]"
              >
                {pending
                  ? "Saving…"
                  : mode === "create"
                    ? "Create asset"
                    : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>

        {mode === "edit" && account ? (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {confirmDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:flex-1">
                  Delete &quot;{account.name}&quot; and its linked sub-category?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={handleDelete}
                >
                  {pending ? "Deleting…" : "Confirm delete"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete asset
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
