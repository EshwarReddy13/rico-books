# Flow: Profit & Loss Calculation

> **Last reviewed against code:** 2026-05-19 — design blueprint. P&L computation
> not implemented; import and categories partially built — see
> `implementation-status.md`. Main category for a line is resolved via sub → main
> or `main_category_id` when main-only — see Step 2 below.
> Read `architecture.md` first.

The P&L statement is one of the app's two primary outputs. This flow describes
how confirmed transactions become a P&L. It is **pure computation** — no AI is
involved anywhere in this flow.

---

## Trigger

The user opens the **Reports** page (or the Dashboard summary) and selects a
period and an entity scope (one entity, or all entities combined).

---

## The steps, in order

### Step 1 — Gather the relevant transaction lines

**What happens:** the engine selects all **Transaction Lines** belonging to
transactions that are:

- `status = confirmed` (pending transactions never count), and
- dated within the selected period, and
- matching the selected entity scope (a specific entity, or all).

Remember from `architecture.md` §3.5: the **line**, not the transaction, is
the unit. A split EMI contributes its interest line here and its principal
line is excluded (see Step 2).

### Step 2 — Keep only P&L lines

**What happens:** for each line, the engine resolves the main category (from
`sub_category → main` when a sub is set, or from `main_category_id` when the
line is main-only) and reads `kind`. Only lines whose main category has
`kind = pnl` are kept.

This is where the `kind` field from the data model does its job. Lines under
`Income` and `Expense` (both `kind = pnl`) are kept. Lines under `Owner
Contribution`, `Assets`, `Loans`, `Transfer` (all `kind = balance_sheet`) are
**dropped** — they do not belong on a P&L.

Concretely: the ₹40,000 principal line of an EMI is dropped here (its category
`Loans → Car Loan` is `balance_sheet`). The ₹10,000 interest line is kept (its
category `Expense → Loan Interest` is `pnl`). This is exactly the correct
treatment — principal is not an expense.

### Step 3 — Apply the sign and aggregate

**What happens:** each kept line is added to a running total according to its
main category's `pnl_sign`:

- `pnl_sign = income` → adds to total income.
- `pnl_sign = expense` → adds to total expenses.

Lines are grouped by sub-category so the report can show expenses broken down
by head (Software, Contractors, Travel, ...) and income by source (Foreign
Income, Family Business, ...). Grouping by *head* matters — ITR needs expenses
itemized, not lumped.

### Step 4 — Add depreciation as an expense

**What happens:** depreciation is a real P&L expense but it is **not** a
transaction — there is no bank line for it. The engine pulls the year's
computed depreciation (see `flow-balance-sheet.md`) and includes it as an
expense line in the P&L.

This is the one P&L input that does not come from a transaction. Do not forget
it — a P&L that omits depreciation overstates profit.

### Step 5 — Produce the result

**What happens:** the engine produces:

- total income (by sub-category),
- total expenses (by sub-category, including depreciation),
- net profit = total income − total expenses,

scoped to the selected period and entity. This is displayed on Reports and
summarized on the Dashboard.

---

## A note on the entity dimension

Because entity is a tag on every line, the same engine produces a per-entity
P&L (filter to one entity) or a combined P&L (no filter). This is why entity
was designed as a tag and not as separate books — one engine, many views.

---

## What this flow assumes

- Transactions have been confirmed (`flow-transaction-import.md`).
- Depreciation for the period has been computed (`flow-balance-sheet.md`).
- The financial-year boundary is respected when "the period" is a financial
  year (`architecture.md` §4.2).

## What this flow deliberately does NOT do

- It does not involve the AI in any way. P&L is arithmetic.
- It does not include balance-sheet movements — those are filtered out in
  Step 2.
- It does not apply tax treatment (business-use percentage, presumptive
  adjustments). The P&L is the pre-tax operating picture; tax adjustments
  happen in `flow-tax-prep.md`.
