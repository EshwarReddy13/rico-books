"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function NavThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
        "sm:justify-start sm:px-3",
        "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        !mounted && "opacity-0",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {mounted && isDark ? (
          <Sun className="size-5" aria-hidden />
        ) : (
          <Moon className="size-5" aria-hidden />
        )}
      </span>
      <span className="hidden truncate text-sm font-medium sm:inline">
        {mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}
      </span>
    </button>
  );
}
