"use client";

import { Building2, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  ADD_NEW_ENTITY_ID,
  PLACEHOLDER_ENTITIES,
  type NavEntity,
} from "@/lib/dashboard/placeholder-entities";
import { cn } from "@/lib/utils";

export function NavEntitySelector() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(PLACEHOLDER_ENTITIES[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected =
    PLACEHOLDER_ENTITIES.find((e) => e.id === selectedId) ?? PLACEHOLDER_ENTITIES[0];

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

  function selectEntity(entity: NavEntity) {
    setSelectedId(entity.id);
    setOpen(false);
  }

  function handleAddNew() {
    setOpen(false);
    // TODO: open add-entity flow
  }

  return (
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
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
          <Building2 className="size-4" aria-hidden />
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium text-zinc-900 sm:inline dark:text-zinc-100">
          {selected?.name ?? "Entity"}
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
            "absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg",
            "dark:border-zinc-700 dark:bg-zinc-900",
            "max-sm:left-1/2 max-sm:w-48 max-sm:-translate-x-1/2",
          )}
        >
          {PLACEHOLDER_ENTITIES.map((entity) => (
            <li key={entity.id} role="option" aria-selected={entity.id === selectedId}>
              <button
                type="button"
                onClick={() => selectEntity(entity)}
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm transition-colors",
                  entity.id === selectedId
                    ? "bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                {entity.name}
              </button>
            </li>
          ))}
          <li role="separator" className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
          <li role="option">
            <button
              type="button"
              onClick={handleAddNew}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Add new entity
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
