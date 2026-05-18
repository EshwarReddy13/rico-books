"use client";

import { Building2, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelColorPicker } from "@/components/ui/label-color-picker";
import {
  apiCreateEntity,
  apiDeleteEntity,
  apiUpdateEntity,
} from "@/lib/entities/entity-api";
import type { EntitySummary } from "@/lib/entities/types";
import { DEFAULT_ENTITY_COLOR } from "@/lib/colors/palette";

export function EntityFormDialog({
  mode,
  entity,
  onClose,
}: {
  mode: "create" | "edit";
  entity?: EntitySummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [colorHex, setColorHex] = useState(
    entity?.colorHex ?? DEFAULT_ENTITY_COLOR,
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
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[EntityFormDialog] submit", { mode, payload });
    }

    let result;
    if (mode === "create") {
      result = await apiCreateEntity(payload);
    } else if (!entity) {
      setPending(false);
      setError("Entity not found.");
      return;
    } else {
      result = await apiUpdateEntity(entity.id, payload);
    }

    setPending(false);

    if (process.env.NODE_ENV === "development") {
      console.log("[EntityFormDialog] result", result);
    }

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!entity) {
      return;
    }
    setPending(true);
    setError(null);

    const result = await apiDeleteEntity(entity.id);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  const title = mode === "create" ? "New entity" : "Edit entity";
  const subtitle =
    mode === "create"
      ? "Tag transactions with a business or context."
      : "Update name, description, or color.";

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
        aria-labelledby="entity-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: colorHex }}
            >
              <Building2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="entity-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {subtitle}
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
          {mode === "edit" && entity ? (
            <input type="hidden" name="id" value={entity.id} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="entity-name">Name</Label>
            <Input
              id="entity-name"
              name="name"
              required
              maxLength={120}
              defaultValue={entity?.name ?? ""}
              placeholder="e.g. Agency"
              disabled={pending}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entity-description">Short description</Label>
            <textarea
              id="entity-description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={entity?.description ?? ""}
              placeholder="Context for AI categorization (optional)"
              disabled={pending}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <LabelColorPicker
            id="entity-color"
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
                    ? "Create entity"
                    : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>

        {mode === "edit" && entity ? (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {confirmDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:flex-1">
                  Delete &quot;{entity.name}&quot;? Transaction lines will lose
                  this tag.
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
                Delete entity
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
