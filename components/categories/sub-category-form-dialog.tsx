"use client";

import { Tag, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelColorPicker } from "@/components/ui/label-color-picker";
import {
  apiCreateSubCategory,
  apiDeleteSubCategory,
  apiUpdateSubCategory,
} from "@/lib/categories/category-api";
import type { SubCategorySummary } from "@/lib/categories/types";
import { DEFAULT_SUB_CATEGORY_COLOR } from "@/lib/colors/palette";

export function SubCategoryFormDialog({
  mode,
  sub,
  mainCategoryId,
  mainCategoryName,
  onClose,
  onCreated,
}: {
  mode: "create" | "edit";
  sub?: SubCategorySummary | null;
  mainCategoryId: string;
  mainCategoryName: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [colorHex, setColorHex] = useState(
    sub?.colorHex ?? DEFAULT_SUB_CATEGORY_COLOR,
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
      mainCategoryId,
    };

    let result;
    if (mode === "create") {
      result = await apiCreateSubCategory(payload);
    } else if (!sub) {
      setPending(false);
      setError("Sub-category not found.");
      return;
    } else {
      result = await apiUpdateSubCategory(sub.id, payload);
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
    if (!sub) {
      return;
    }
    setPending(true);
    setError(null);

    const result = await apiDeleteSubCategory(sub.id);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  const title =
    mode === "create" ? "New sub-category" : "Edit sub-category";

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
        aria-labelledby="sub-category-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: colorHex }}
            >
              <Tag className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="sub-category-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Under <span className="font-medium">{mainCategoryName}</span>
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

        {sub?.linkedRecordId ? (
          <p className="mt-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200">
            Linked to register account{" "}
            <span className="font-medium">
              {sub.linkedAccountName ?? sub.name}
            </span>{" "}
            ({sub.linkedRecordType}) ·{" "}
            <span className="font-mono">{sub.linkedRecordId}</span>. Edit the
            asset or liability on its page; name stays in sync.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-category-name">Name</Label>
            <Input
              id="sub-category-name"
              name="name"
              required
              maxLength={120}
              defaultValue={sub?.name ?? ""}
              placeholder="e.g. Foreign Income"
              disabled={pending || Boolean(sub?.linkedRecordId)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-category-description">Short description</Label>
            <textarea
              id="sub-category-description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={sub?.description ?? ""}
              placeholder="Optional context for categorization"
              disabled={pending}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <LabelColorPicker
            id="sub-category-color"
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
                    ? "Create sub-category"
                    : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>

        {mode === "edit" && sub && !sub.linkedRecordId ? (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {confirmDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:flex-1">
                  Delete &quot;{sub.name}&quot;? Linked transactions may need
                  re-categorization.
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
                Delete sub-category
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
