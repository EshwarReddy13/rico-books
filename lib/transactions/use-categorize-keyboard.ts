"use client";

import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useCategorizeKeyboard(handlers: {
  enabled: boolean;
  onSaveAndNext: () => void;
  onSkip: () => void;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
}) {
  const {
    enabled,
    onSaveAndNext,
    onSkip,
    onSelectPrevious,
    onSelectNext,
  } = handlers;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) {
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSaveAndNext();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        onSelectNext();
        return;
      }

      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onSelectPrevious();
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        onSkip();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    onSaveAndNext,
    onSkip,
    onSelectPrevious,
    onSelectNext,
  ]);
}
