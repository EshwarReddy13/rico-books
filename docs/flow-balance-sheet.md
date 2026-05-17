# Flow: Balance Sheet, Depreciation & Net Worth

> Last reviewed against code: not yet built — design blueprint.
> Read `architecture.md` first, especially §4 (opening balances and the
> financial-year boundary) — this flow depends on both.

The balance sheet is the app's second primary output. It answers: *what do I
own, what do I owe, what is my net worth?* This flow is **pure computation** —
no AI.

The key thing to understand: **calculation order matters here.** Unlike the
P&L (a simple sum), the balance sheet must be built in a specific sequence,
and that sequence is not visible from any single function. That is the main
reason this flow doc exists.

---

## Trigger

The user opens the **Assets & Liabilities** page or the net-worth section of
Reports / Dashboard, for a chosen date or financial year.

---

## The calculation order

### Step 1 — Start from opening balances

**What happens:** the engine begins with each Account's `opening_value` as of
its `opening_date` (see `architecture.md` §4.1). This is the floor everything
builds on. The app starts mid-life — bank accounts hold money, the loan has an
outstanding balance, the car has a depreciated value carried from before.

**If this step is skipped or assumed-zero, every number below is wrong.**

### Step 2 — Apply confirmed transactions to account balances

**What happens:** for each **bank/asset account**, the engine applies every
confirmed transaction on that account between the opening date and the report
date — credits raise the balance, debits lower it — to arrive at the account's
current cash balance.

### Step 3 — Derive each loan's outstanding balance

**What happens:** for each **loan (liability)**, the engine takes the loan's
opening outstanding balance and subtracts every **principal** line that has
been confirmed (the principal lines produced by the EMI split — see
`flow-emi-split.md`). The result is the loan's current outstanding balance.

Note: only the *principal* reduces the loan. The interest portion is a P&L
expense and has no effect on the loan balance. The split done at import time
is what makes this clean.

### Step 4 — Compute depreciation and the asset's written-down value

**What happens:** for each **depreciable asset** (the car, equipment — not
bank accounts), the engine computes the year's depreciation.

- Depreciation for the year = **opening WDV × depreciation_rate**.
  (WDV = written-down value; the rate comes from the asset's `asset_type`,
  e.g. vehicles 15%, computers 40% — stored as an editable field, never
  hard-coded.)
- Closing WDV = opening WDV − depreciation for the year.
- The asset's *cost* is established from the acquisition transactions: the
  down payment (a line categorized `Assets → Car`) plus the loan-financed
  amount together form the original cost. The first year's opening WDV is
  that cost; later years' opening WDV is the prior year's closing WDV.

**Where the depreciation number goes:** it is reported here as part of net
worth, *and* it is handed to `flow-pnl-calculation.md` Step 4 as a P&L expense,
*and* it feeds `flow-tax-prep.md`. One computation, three consumers.

### Step 5 — Compute net worth

**What happens:**

- Total assets = sum of (bank/cash balances from Step 2) + (asset WDVs from
  Step 4).
- Total liabilities = sum of (loan outstanding balances from Step 3) + any
  other liabilities.
- **Net worth = total assets − total liabilities.**

This is displayed on the Assets & Liabilities page and summarized on the
Dashboard.

---

## Reconciliation — how the app proves it is correct

After importing a period, the app performs a reconciliation check per bank
account:

> opening balance + total credits − total debits = computed closing balance

The user compares the computed closing balance against the actual closing
balance printed on the bank statement. If they do not match, something is
miscategorized, double-counted, or missing. **This check is what makes the
numbers trustworthy at filing time** — without it, the app has no way to know
its own data is right. It is a small feature with outsized value; build it.

---

## The financial-year roll-forward

Indian FY runs April–March (`architecture.md` §4.2). At year-end the app
performs a roll-forward:

- Each depreciable asset's **closing WDV becomes the next year's opening WDV.**
- Each loan's **closing outstanding balance becomes next year's opening
  balance.**
- Bank account closing balances carry forward as next year's opening balances.

After roll-forward, the new financial year starts from correct opening
balances automatically, and the prior year's figures are frozen for the
record. The roll-forward is the structural reason the FY boundary is not
cosmetic.

---

## What this flow assumes

- Opening balances were set at app setup (`architecture.md` §4.1).
- Transactions are confirmed (`flow-transaction-import.md`).
- EMI splits exist, so principal lines are available for Step 3
  (`flow-emi-split.md`).
- Each depreciable asset has an `asset_type` and `depreciation_rate`.

## What this flow deliberately does NOT do

- It does not use the AI. The balance sheet is arithmetic.
- It does not decide tax-deductible depreciation — it computes *book*
  depreciation; the business-use-percentage adjustment for tax happens in
  `flow-tax-prep.md`.
- It does not compute the P&L — it only *hands depreciation* to that flow.
