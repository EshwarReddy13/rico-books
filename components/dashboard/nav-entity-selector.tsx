"use client";

import { Building2, ChevronDown, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EntityFormDialog } from "@/components/entities/entity-form-dialog";
import type { EntitySummary } from "@/lib/entities/types";
import { cn } from "@/lib/utils";

const SELECTED_ENTITY_STORAGE_KEY = "rico-books-selected-entity-id";

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; entity: EntitySummary };

export function NavEntitySelector({ entities }: { entities: EntitySummary[] }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_ENTITY_STORAGE_KEY);
    if (stored && entities.some((e) => e.id === stored)) {
      setSelectedId(stored);
      return;
    }
    if (entities[0]) {
      setSelectedId(entities[0].id);
    } else {
      setSelectedId("");
    }
  }, [entities]);

  const selected =
    entities.find((e) => e.id === selectedId) ?? entities[0] ?? null;

  useEffect(() => {
    if (selectedId) {
      window.localStorage.setItem(SELECTED_ENTITY_STORAGE_KEY, selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }
  }, [open]);

  function selectEntity(entity: EntitySummary) {
    setSelectedId(entity.id);
    setOpen(false);
  }

  function openCreate() {
    setOpen(false);
    setDialog({ open: true, mode: "create" });
  }

  function openEdit(entity: EntitySummary) {
    setOpen(false);
    setDialog({ open: true, mode: "edit", entity });
  }

  function closeDialog() {
    setDialog({ open: false });
  }

  return (
    <>
      <div ref={rootRef} className="relative px-1 sm:px-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 px-2 py-2 transition-colors",
            "hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-800",
            "sm:gap-3 sm:px-3 sm:py-2.5",
            open && "bg-zinc-100 dark:bg-zinc-800",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Select entity"
        >
          <EntityColorIcon
            colorHex={selected?.colorHex}
            className="size-9 shrink-0 shadow-sm"
          />
          <span className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium text-zinc-900 sm:inline dark:text-zinc-100">
            {selected?.name ?? "No entity"}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 shrink-0 text-zinc-500 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            className={cn(
              "absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg",
              "dark:border-zinc-700 dark:bg-zinc-900",
              "max-sm:left-1/2 max-sm:w-48 max-sm:-translate-x-1/2",
            )}
          >
            {entities.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">No entities yet</li>
            ) : (
              entities.map((entity) => (
                <li
                  key={entity.id}
                  role="option"
                  aria-selected={entity.id === selectedId}
                  className="group flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => selectEntity(entity)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      entity.id === selectedId
                        ? "bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    )}
                  >
                    <EntityColorIcon colorHex={entity.colorHex} className="size-7" />
                    <span className="truncate">{entity.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(entity)}
                    className="mr-1 shrink-0 rounded-lg p-1.5 text-zinc-950 transition-colors hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                    aria-label={`Edit ${entity.name}`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))
            )}
            <li role="separator" className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
            <li role="option">
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Add new entity
              </button>
            </li>
          </ul>
        ) : null}
      </div>

      {dialog.open ? (
        <EntityFormDialog
          mode={dialog.mode}
          entity={dialog.mode === "edit" ? dialog.entity : null}
          onClose={closeDialog}
        />
      ) : null}
    </>
  );
}

function EntityColorIcon({
  colorHex,
  className,
}: {
  colorHex?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
        className,
      )}
      style={
        colorHex
          ? {
              boxShadow: `inset 0 0 0 3px ${colorHex}`,
            }
          : undefined
      }
    >
      <Building2 className="size-4" aria-hidden />
    </span>
  );
}
