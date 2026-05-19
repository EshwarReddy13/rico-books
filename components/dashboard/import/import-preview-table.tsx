"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatInrFromPaise } from "@/lib/dashboard/currency";
import type { ImportConfirmRow } from "@/lib/import/types";
import { cn } from "@/lib/utils";

function formatRowDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function ImportPreviewTable({
  rows,
  onChange,
}: {
  rows: ImportConfirmRow[];
  onChange: (rows: ImportConfirmRow[]) => void;
}) {
  const selectedCount = rows.filter((r) => r.include).length;

  function setAll(include: boolean) {
    onChange(
      rows.map((row) => ({
        ...row,
        include: row.isDuplicate ? false : include,
      })),
    );
  }

  function toggleRow(clientId: string, include: boolean) {
    onChange(
      rows.map((row) =>
        row.clientId === clientId ? { ...row, include } : row,
      ),
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          {selectedCount} of {rows.length} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="font-medium text-violet-700 hover:underline dark:text-violet-400"
          >
            Select all new
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="max-h-[min(50vh,420px)] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-3 py-2" scope="col">
                <span className="sr-only">Include</span>
              </th>
              <th className="px-3 py-2" scope="col">
                Date
              </th>
              <th className="px-3 py-2" scope="col">
                Narration
              </th>
              <th className="px-3 py-2 text-right" scope="col">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr
                key={row.clientId}
                className={cn(
                  row.isDuplicate && "bg-zinc-50/80 dark:bg-zinc-800/40",
                  !row.include && "opacity-60",
                )}
              >
                <td className="px-3 py-2 align-top">
                  <Checkbox
                    checked={row.include}
                    disabled={row.isDuplicate}
                    onCheckedChange={(checked) =>
                      toggleRow(row.clientId, checked === true)
                    }
                    aria-label={`Include row ${row.rowNumber}`}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-top text-zinc-700 dark:text-zinc-300">
                  {formatRowDate(row.date)}
                </td>
                <td className="max-w-[280px] px-3 py-2 align-top">
                  <p className="line-clamp-2 text-zinc-950 dark:text-zinc-50">
                    {row.rawDescription}
                  </p>
                  {row.isDuplicate ? (
                    <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Already imported
                    </p>
                  ) : null}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-right align-top font-medium tabular-nums",
                    row.direction === "credit"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-950 dark:text-zinc-50",
                  )}
                >
                  {row.direction === "credit" ? "+" : "−"}
                  {formatInrFromPaise(row.amountPaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
