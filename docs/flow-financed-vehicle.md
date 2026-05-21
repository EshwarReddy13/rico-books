# Flow: Financed vehicle (asset + loan + down payment)

> **Last reviewed against code:** 2026-05-19  
> Read `architecture.md` first, then `flow-emi-split.md` for EMI matching and splits.  
> Code: `lib/accounts/sync-asset-cost-from-financing.ts`, `lib/accounts/compute-asset-cost.ts`,
> `lib/loans/load-loan-schedule.ts`, `lib/accounts/load-asset-down-payments.ts`.

This flow ties together three register records and bank transactions for a typical
car purchase: the **vehicle asset**, the **loan liability**, and one or more **down
payment** debits on the bank statement.

---

## The three pieces

| Piece | Register | Sub-category | Role |
|-------|----------|--------------|------|
| Vehicle | Asset (`asset_type = vehicle`, etc.) | `Assets → {vehicle name}` | Balance sheet — cost of the car |
| Loan | Liability | `Loans → {loan name}` | Balance sheet — principal still owed |
| Down payment | Bank transaction (debit) | Categorized to `Assets → {vehicle}` | Reduces cash; increases asset cost |

The loan’s **Financed asset** field (`Loan.financed_asset_account_id`) links the
liability to the vehicle. Down payments link via `TransactionLine.linked_account_id`
(set when the user confirms categorization to the asset’s sub-category).

**Bank accounts do not** auto-create an Assets sub-category (by design).

---

## Vehicle cost (computed and stored)

**Formula (code, not AI):**

```
vehicle cost = Σ down payment line amounts linked to the asset
             + loan amount_financed
```

- **Down payments:** sum of `transaction_lines.amount_paise` where
  `linked_account_id` = asset id and `linked_account_type = asset`.
- **Loan portion:** `loans.amount_financed_paise` for the loan whose
  `financed_asset_account_id` points at this asset.

**As-of date** (when sync runs):

1. Earliest date among linked down-payment transactions, else  
2. `loans.schedule_generated_date`, else  
3. First schedule row `due_date`.

### When cost is written to the database

Sync runs **only** on explicit events — never on page load or list queries.

| Trigger | Function |
|---------|----------|
| Loan saved / linked to a financed asset | `upsertLoanForLiability` → `syncAssetCostAfterLoanLinkChange` |
| Loan re-linked to a different vehicle | Re-sync **old** and **new** asset |
| Loan schedule PDF confirmed | `confirmLoanSchedule` → `syncAssetCostFromFinancing` |
| Transaction categorized to `Assets → {vehicle}` | `saveTransactionCategorization` → `syncAssetCostFromFinancing` |
| Asset register created | `createRegisterAssetRecord` → sync (no-op until loan or down payment exists) |

Sync **skips** the write if there is nothing to compute (no financed amount and no
linked down payments). It **skips** if computed values already match the account row
(idempotent).

Persisted fields on the asset `Account`:

- `opening_value_paise` — total cost  
- `opening_date` — as-of date per rules above  

Manual edits in **Edit asset** are saved via `PATCH /api/accounts/asset/[id]` and
are **not** overwritten until the next sync trigger above.

Helpers: `lib/accounts/compute-asset-cost.ts`, `lib/accounts/sync-asset-cost-from-financing.ts`.

---

## UI: Assets page

### Asset cards (non-bank)

- **Loan:** liability name when `financed_asset_account_id` points here.  
- **Balance label:**  
  - `Cost (down payment + loan)` / `Cost (loan financed)` / `Cost (down payments)` when computed inputs exist.  
  - Otherwise **Opening balance** (manual).  
- **Schedule hint:** `N down payments linked` when applicable.  
- **View down payments** — opens a dialog listing linked lines (date, amount, category, confirmed vs pending).

### Edit asset dialog

- Asset type is read-only after creation (disabled `<select>` values are omitted from
  form posts — updates use `parseRegisterAssetUpdateInput`, which does not require type).  
- Blue info note when a loan or down payments exist: cost/date auto-update on sync triggers.  
- Cost / value and as-of date fields show DB values after sync (refresh page if stale).

API: `GET /api/accounts/asset/[id]/down-payments` → `loadAssetDownPaymentsView`.

---

## UI: Liabilities page

### Liability cards

- **Finances:** linked vehicle name.  
- **Outstanding balance** (not opening balance) when a loan exists:  
  `amount_financed − Σ principal on schedule rows with matched_txn_id`.  
- **View repayment schedule** when schedule rows exist.

### Repayment schedule dialog

- Full amortization table from `LoanScheduleRow`.  
- Per row: status **Paid** (linked + transaction confirmed), **Linked · confirm EMI**
  (matched on import, pending review), or **Due**.  
- **Balance after** = lender `closing_balance_paise` from the PDF.  
- Header: outstanding (computed), paid / linked / due counts.

API: `GET /api/loans/[loanId]/schedule` → `loadLoanScheduleView`.

### Liability form (loan setup)

- Optional loan checkbox → loan fields + **Upload lender PDF** (parse without loan id:
  `POST /api/loans/parse-document`).  
- Apply to form → save liability + confirm schedule in one step when checksums pass.  
- **View repayment schedule** when schedule already saved.

---

## EMI matching (does not use asset sub-category first)

Matching runs on **bank import confirm**, not when the user picks a category.

Criteria per open schedule row:

- Debit, amount **equals** row `emi_amount_paise` (per-row, not a single global EMI).  
- Date within **±10 days** of row `due_date`.  
- Row not already matched.

On match, code replaces lines with interest + principal split and sets
`loan_schedule_rows.matched_txn_id`. See `flow-emi-split.md` and
`lib/loans/match-emi-on-import.ts`.

**Categorizing the full EMI to the loan sub does not** split or link the schedule;
the schedule drives the split.

---

## Linked sub-categories

Each register asset/liability (non-bank) gets one sub-category via
`createLinkedSubCategoryInTx`:

- `sub_categories.linked_record_id` + `linked_record_type` (`asset` | `liability`)  
- Unique per register account  

Renaming the register account updates the sub-category name in the same transaction.

---

## API routes (this flow)

| Path | Purpose |
|------|---------|
| `GET /api/loans/[loanId]/schedule` | Repayment schedule + link status |
| `POST /api/loans/parse-document` | Parse amortization PDF before loan exists |
| `POST /api/loans/[loanId]/schedule/parse` | Parse PDF for existing loan |
| `POST /api/loans/[loanId]/schedule/confirm` | Save schedule rows + sync asset cost if financed |
| `GET/PUT /api/accounts/liability/[id]/loan` | Loan header |
| `GET /api/accounts/asset/[id]/down-payments` | Linked down payment lines |

---

## Typical setup order

1. Create **asset** (vehicle) — sub `Assets → {name}` created.  
2. Create **liability** + loan header + upload schedule PDF — link **Financed asset**.  
   → Asset cost/date sync if `amount_financed` set.  
3. Import bank CSV — EMIs may auto-match and pre-split.  
4. Categorize **down payment** debit to `Assets → {vehicle}` and confirm.  
   → Asset cost/date sync again (down payment + financed).  
5. Confirm EMI splits on Transactions.  
6. Review **repayment schedule** and **down payments** from Liabilities / Assets cards.

---

## Related docs

- `flow-emi-split.md` — schedule extraction, checksums, EMI matcher, categorize UI  
- `flow-transaction-import.md` — import pipeline (step 5 calls EMI matcher)  
- `flow-balance-sheet.md` — how assets and loans roll into net worth (when built)  
- `implementation-status.md` — shipped checklist
