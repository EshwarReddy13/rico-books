# Finance & ITR App — Design Blueprint / Documentation

This `/docs` folder is both the **design blueprint** for the app and its
**living documentation**. It is part of the codebase. A new contributor
should be able to read it and understand how the whole system works.

## Read in this order

1. **`architecture.md`** — start here. What the app is, the core data model
   (8 objects), the one governing principle, the pages, and the tech stack.
2. **`flow-transaction-import.md`** — how money gets in and gets categorized.
   The most-used flow.
3. **`flow-emi-split.md`** — loans, the amortization schedule, the EMI
   principal/interest split.
4. **`flow-pnl-calculation.md`** — how the Profit & Loss number is produced.
5. **`flow-balance-sheet.md`** — assets, depreciation, net worth, the
   financial-year roll-forward.
6. **`flow-tax-prep.md`** — preparing the ITR figures, including the dual
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

v1 **includes**: statement import (CSV / Excel) + AI categorization +
confirmation, the category tree, transaction splits, loans/EMI/amortization,
assets + depreciation, the balance sheet, the tax profile + dual tax
computation, reports + export, and these flow docs.

v1 **excludes** (deferred, not forgotten): PDF statement import (CSV/Excel
only for now), GST, multi-currency, automated backup. The data model leaves
room for them; do not let them creep into v1 silently.
