"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { getBankInstitutionTagClass } from "@/lib/accounts/bank-options";
import type { ImportBankAccountOption } from "@/lib/accounts/types";
import { cn } from "@/lib/utils";

function BankTag({
  label,
  bankInstitution,
}: {
  label: string;
  bankInstitution: ImportBankAccountOption["bankInstitution"];
}) {
  if (!label) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight sm:text-xs",
        getBankInstitutionTagClass(bankInstitution),
      )}
    >
      {label}
    </span>
  );
}

function AccountOptionContent({ account }: { account: ImportBankAccountOption }) {
  return (
    <div className="min-w-0 flex-1 text-left">
      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {account.nickname}
      </p>
      <div className="mt-1">
        <BankTag
          label={account.bankLabel}
          bankInstitution={account.bankInstitution}
        />
      </div>
    </div>
  );
}

export function ImportBankAccountPicker({
  accounts,
  value,
  onChange,
  disabled,
}: {
  accounts: ImportBankAccountOption[];
  value: string;
  onChange: (accountId: string) => void;
  disabled?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = accounts.find((a) => a.id === value);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="import-dialog-account"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-auto min-h-11 w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm outline-none",
          "focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40",
          "disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950",
        )}
      >
        {selected ? (
          <AccountOptionContent account={selected} />
        ) : (
          <span className="flex-1 py-1 text-zinc-500">Select account…</span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby="import-dialog-account"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {accounts.map((account) => {
            const active = account.id === value;
            return (
              <li key={account.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(account.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800",
                    active && "bg-violet-50/80 dark:bg-violet-950/30",
                  )}
                >
                  <AccountOptionContent account={account} />
                  {active ? (
                    <Check className="size-4 shrink-0 text-violet-600" aria-hidden />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
