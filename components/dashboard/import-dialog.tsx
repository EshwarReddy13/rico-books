"use client";

import Link from "next/link";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PLACEHOLDER_ACCOUNTS = [
  { id: "placeholder-hdfc", label: "HDFC Current A/c" },
];

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const canImport = Boolean(accountId && fileName);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <Upload className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="import-dialog-title"
                className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              >
                Import statement
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                CSV or Excel — HDFC format for v1.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="import-dialog-account">Bank account</Label>
            <select
              id="import-dialog-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Select account…</option>
              {PLACEHOLDER_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              Add accounts in{" "}
              <Link
                href="/settings"
                className="font-medium underline-offset-2 hover:underline"
                onClick={onClose}
              >
                Settings
              </Link>
              .
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
              dragOver
                ? "border-violet-400 bg-violet-50/50"
                : "border-neutral-200 bg-zinc-50/80 hover:border-neutral-300 dark:border-zinc-700 dark:bg-zinc-800/50",
            )}
          >
            <FileSpreadsheet className="size-8 text-zinc-400" aria-hidden />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {fileName ?? "Drop file or click to browse"}
            </span>
            <span className="text-xs text-zinc-500">.csv, .xlsx</span>
          </button>

          <Button
            type="button"
            disabled={!canImport}
            className="h-11 w-full bg-zinc-950 text-white hover:bg-zinc-900"
          >
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}
