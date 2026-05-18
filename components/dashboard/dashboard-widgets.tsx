"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { ImportDialog } from "@/components/dashboard/import-dialog";

function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-5 shadow-sm transition hover:bg-zinc-50 sm:rounded-3xl dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
    </button>
  );
}

export function ActionWidget() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        Actions
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          label="Import"
          icon={Upload}
          onClick={() => setImportOpen(true)}
        />
        <ActionButton label="Transfer" icon={ArrowUpRight} />
        <ActionButton label="Receive" icon={ArrowDownLeft} />
      </div>
      {importOpen ? <ImportDialog onClose={() => setImportOpen(false)} /> : null}
    </section>
  );
}

export function ExpensesMayWidget() {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Expenses in May</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        $1262,22
      </p>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full">
        <span className="w-[45%] bg-teal-400" />
        <span className="w-[30%] bg-emerald-300" />
        <span className="w-[25%] bg-violet-400" />
      </div>
    </article>
  );
}

export function FavoriteSpendsWidget() {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Favorite spends</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
          VK
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-amber-400 text-lg">
          👻
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-rose-400 text-xs font-bold text-white">
          S
        </span>
      </div>
    </article>
  );
}
