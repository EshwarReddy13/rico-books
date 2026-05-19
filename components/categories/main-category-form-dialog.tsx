"use client";

import { FolderTree, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelColorPicker } from "@/components/ui/label-color-picker";
import {
  apiCreateMainCategory,
  apiDeleteMainCategory,
  apiUpdateMainCategory,
} from "@/lib/categories/category-api";
import type { MainCategorySummary } from "@/lib/categories/types";
import { FALLBACK_LABEL_COLOR } from "@/lib/colors/palette";
import { cn } from "@/lib/utils";

export function MainCategoryFormDialog({
  mode,
  main,
  onClose,
  onCreated,
}: {
  mode: "create" | "edit";
  main?: MainCategorySummary | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [colorHex, setColorHex] = useState(
    main?.colorHex ?? FALLBACK_LABEL_COLOR,
  );
  const [kind, setKind] = useState<"pnl" | "balance_sheet">(
    main?.kind ?? "pnl",
  );
  const [pnlSign, setPnlSign] = useState<"income" | "expense">(
    main?.pnlSign === "expense" ? "expense" : "income",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      description: ((formData.get("description") as string) ?? "").trim(),
      colorHex,
      kind,
      pnlSign: kind === "pnl" ? pnlSign : null,
    };

    let result;
    if (mode === "create") {
      result = await apiCreateMainCategory(payload);
    } else if (!main) {
      setPending(false);
      setError("Category not found.");
      return;
    } else {
      result = await apiUpdateMainCategory(main.id, payload);
    }

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "create" && result.id) {
      onCreated?.(result.id);
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!main) {
      return;
    }
    setPending(true);
    setError(null);

    const result = await apiDeleteMainCategory(main.id);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  const title = mode === "create" ? "New main category" : "Edit main category";

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
        aria-labelledby="main-category-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: colorHex }}
            >
              <FolderTree className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="main-category-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {mode === "create"
                  ? "Group transactions for P&L or balance sheet."
                  : "Update name, type, description, or color."}
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
            <Label htmlFor="main-category-name">Name</Label>
            <Input
              id="main-category-name"
              name="name"
              required
              maxLength={120}
              defaultValue={main?.name ?? ""}
              placeholder="e.g. Income"
              disabled={pending}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="main-category-kind">Category type</Label>
            <select
              id="main-category-kind"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as "pnl" | "balance_sheet")
              }
              disabled={pending}
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="pnl">Profit &amp; Loss</option>
              <option value="balance_sheet">Balance sheet</option>
            </select>
          </div>

          {kind === "pnl" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                P&amp;L sign
              </legend>
              <div className="flex gap-2">
                {(["income", "expense"] as const).map((sign) => (
                  <button
                    key={sign}
                    type="button"
                    onClick={() => setPnlSign(sign)}
                    disabled={pending}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition",
                      pnlSign === sign
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300",
                    )}
                  >
                    {sign}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="main-category-description">Short description</Label>
            <textarea
              id="main-category-description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={main?.description ?? ""}
              placeholder="Optional context for categorization"
              disabled={pending}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <LabelColorPicker
            id="main-category-color"
            value={colorHex}
            onChange={setColorHex}
          />

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
                    ? "Create category"
                    : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>

        {mode === "edit" && main ? (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {confirmDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:flex-1">
                  Delete &quot;{main.name}&quot;? Remove sub-categories first.
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
                Delete main category
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
