"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function SettingsThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className="flex items-center gap-2 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        disabled={!mounted}
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          !isDark
            ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400",
        )}
        aria-pressed={!isDark}
      >
        <Sun className="size-3.5" aria-hidden />
        Light
      </button>
      <button
        type="button"
        disabled={!mounted}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          isDark
            ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400",
        )}
        aria-pressed={isDark}
      >
        <Moon className="size-3.5" aria-hidden />
        Dark
      </button>
    </div>
  );
}
