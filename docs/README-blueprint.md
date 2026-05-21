# Finance & ITR App — Design Blueprint / Documentation

This `/docs` folder is both the **design blueprint** for the app and its
**living documentation**. It is part of the codebase. A new contributor
should be able to read it and understand how the whole system works.

## Read in this order

1. **`architecture.md`** — start here. What the app is, the core data model,
   the one governing principle, the pages (including **§5.1** — current UI),
   and the tech stack.
2. **`implementation-status.md`** — what is built vs planned (import slice 1,
   Gemini connection, main-only categories, etc.). Read this before coding the
   next slice.
3. **`ai-setup.md`** — Gemini API key, model id, ping test, planned categorize contract.
4. **`flow-transaction-import.md`** — how money gets in and gets categorized.
   The most-used flow.
5. **`flow-emi-split.md`** — loans, the amortization schedule, the EMI
   principal/interest split.
6. **`flow-financed-vehicle.md`** — linking a vehicle asset to a loan, down
   payments, auto cost sync, schedule and down-payment viewers.
7. **`flow-pnl-calculation.md`** — how the Profit & Loss number is produced.
8. **`flow-balance-sheet.md`** — assets, depreciation, net worth, the
   financial-year roll-forward.
9. **`flow-tax-prep.md`** — preparing the ITR figures, including the dual
   presumptive-vs-actual computation.

## The one principle that governs everything

> **AI proposes. Code computes. The human confirms.**

If you remember nothing else, remember this. The AI reads messy inputs and
drafts suggestions. Plain deterministic code does every calculation. Nothing
counts until the user confirms it. See `architecture.md` §2.

## Documentation discipline — mandatory

> **If a pull request changes how a flow works, it must update that flow's
> doc in the same pull request.**

Out-of-date docs are worse than no docs — they actively mislead. Each flow
doc carries a "last reviewed against code" line at the top; keep it honest.
Code entry points should carry a one-line pointer comment back to the
relevant doc (e.g. `// Transaction import flow — see
docs/flow-transaction-import.md`).

## Scope reminder

**Build progress** is tracked in `implementation-status.md` (import Steps 1–3
done; Gemini connected; categorization next).

v1 **includes**: statement import (CSV / Excel) + AI categorization +
confirmation, the category tree, transaction splits, loans/EMI/amortization,
assets + depreciation, the balance sheet, the tax profile + dual tax
computation, reports + export, and these flow docs.

v1 **excludes** (deferred, not forgotten): PDF statement import (CSV/Excel
only for now), GST, multi-currency, automated backup. The data model leaves
room for them; do not let them creep into v1 silently.
