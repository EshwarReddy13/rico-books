"use client";

import { DEFAULT_LABEL_COLORS } from "@/lib/colors/palette";
import { cn } from "@/lib/utils";

export function LabelColorPicker({
  value,
  onChange,
  id,
  label = "Color",
}: {
  value: string;
  onChange: (hex: string) => void;
  id?: string;
  label?: string;
}) {
  const pickerId = id ?? "label-color-picker";

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_LABEL_COLORS.map((hex) => {
          const selected = value.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onChange(hex)}
              className={cn(
                "size-8 rounded-full border-2 transition-transform hover:scale-105",
                selected
                  ? "border-zinc-950 ring-2 ring-zinc-950/20 dark:border-zinc-50 dark:ring-zinc-50/20"
                  : "border-transparent",
              )}
              style={{ backgroundColor: hex }}
              aria-label={`Color ${hex}`}
              aria-pressed={selected}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={pickerId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 cursor-pointer rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-950"
          aria-label="Custom color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm uppercase outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 dark:border-zinc-700 dark:bg-zinc-950"
          spellCheck={false}
          maxLength={7}
          aria-label="Color hex value"
        />
      </div>
    </div>
  );
}
