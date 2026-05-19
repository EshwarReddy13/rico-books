"use client";

import { useEffect, useState } from "react";

import type { EntitySummary } from "@/lib/entities/types";

export const SELECTED_ENTITY_STORAGE_KEY = "rico-books-selected-entity-id";
export const SELECTED_ENTITY_CHANGED_EVENT = "rico-books-entity-changed";

/** Sync read of the side-nav entity id (client only). */
export function readStoredEntityId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(SELECTED_ENTITY_STORAGE_KEY);
  return stored?.trim() || null;
}

/** Reads the entity id chosen in the side nav (localStorage). */
export function useSelectedEntityId(entities: EntitySummary[]): string | null {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    function read() {
      const stored = window.localStorage.getItem(SELECTED_ENTITY_STORAGE_KEY);
      if (stored && entities.some((e) => e.id === stored)) {
        setSelectedId(stored);
        return;
      }
      setSelectedId(entities[0]?.id ?? null);
    }

    read();

    function onStorage(e: StorageEvent) {
      if (e.key === SELECTED_ENTITY_STORAGE_KEY) {
        read();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(SELECTED_ENTITY_CHANGED_EVENT, read);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SELECTED_ENTITY_CHANGED_EVENT, read);
    };
  }, [entities]);

  return selectedId;
}
