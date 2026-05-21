# Flow: Loans, the Amortization Schedule & the EMI Split

> **Last reviewed against code:** 2026-05-19 — **implemented** (schedule import, EMI
> matcher, split categorize UI). Asset/loan linking and cost sync:
> `flow-financed-vehicle.md`. See `implementation-status.md`.
> Read `architecture.md` first. This flow is where the "AI proposes, code
> computes" principle matters most concretely.

A loan EMI arrives on a bank statement as a **single number** — e.g. a
₹50,000 debit. But that ₹50,000 is two different things glued together:

- the **interest** portion (e.g. ₹10,000) — a deductible business expense,
  it belongs on the P&L;
- the **principal** portion (e.g. ₹40,000) — repayment of borrowed money,
  **not** an expense, it belongs on the balance sheet (it reduces the loan).

The split changes every month: early EMIs are mostly interest, later EMIs
mostly principal. This flow is how the app handles that correctly and
automatically.

---

## Two jobs — handled very differently

This flow is really two jobs. **Keep them separate in your mind and in the
code.**

| Job                                | Tool  | Frequency        |
|-------------------------------------|-------|------------------|
| 1. Read the loan schedule document  | AI    | once, at setup   |
| 2. Match EMI transactions & split   | Code  | every month, forever |

The most common mistake a new contributor will make here is using the AI for
Job 2. **Do not.** Reasoning below.

---

## Job 1 — Read the loan schedule document (AI, once)

### Trigger

The user sets up a loan on the **Liabilities** page and uploads the loan's
amortization schedule document (a PDF or Excel from the bank).

### Steps

1. The user creates the **liability** Account record (name, e.g. "VW Virtus
   Car Loan", `account_kind = liability`).
2. The user uploads the amortization schedule document (a PDF or Excel from
   the lender).
3. **The AI reads the document** and extracts two things:
   - the **loan header** → a `Loan` record: agreement number, lender, loan
     type, amount financed, tenure, frequency, total payable, total interest,
     schedule-generated date;
   - the **schedule table** → one `Loan Schedule Row` per instalment:
     instalment number, due date, EMI amount, principal portion, interest
     portion, closing balance.
   This is exactly what AI is good at: pulling structure out of a document.
4. **Code verifies the extraction against the lender's own checksums.** The
   `Loan` header stores three totals; code sums the extracted rows and
   confirms they match:
   - `Σ principal_amount` of all rows  ==  `amount_financed`
   - `Σ interest_amount` of all rows   ==  `total_interest`
   - `Σ emi_amount` of all rows        ==  `total_payable`
   If all three match, the extraction is *arithmetically proven* complete and
   correct — not merely "the AI seemed confident". If any do not match, a row
   was missed or misread, and the app flags it for the user before the
   schedule is trusted. The lender printed the answer key; this step grades
   the AI against it.
5. The `Loan` and its `Loan Schedule Row` records are saved, linked to the
   liability Account. The user reviews the verified table and confirms (the AI
   proposed it; code verified it; the human confirms it).

### Why the AI here, and why only here

Reading a lender's amortization PDF into clean records is a *reading* task —
unstructured input, structured output. That is the AI's job. And it runs
**once**: after extraction and checksum verification, the schedule is fixed
reference data the rest of the app trusts. Using the lender's official
schedule is *better* than computing the table from a formula — it is the real
numbers, including the irregular first and last instalments a formula would
never reproduce.

If the document is a scan / photo rather than a clean digital PDF, the read
still works but is OCR-flavored — the checksum verification in step 4 is
exactly what catches an OCR misread before it does any damage.

---

## Job 2 — Match EMI transactions and split them (code, every month)

This job runs as **Step 5 of the transaction import flow** (see
`flow-transaction-import.md`). It is described in full here.

### What happens

When transactions are imported, code checks each one against the **open**
(unmatched) rows of every loan's amortization schedule:

- A transaction whose amount matches a schedule row's `emi_amount`, with a
  date inside a tolerance window around that row's `due_date`, is matched to
  that row.
- The transaction is **pre-split into two Transaction Lines** using the
  figures already in the matched schedule row:
  - Line 1 = `interest_amount` → sub-category `Expense → Loan Interest`
    → flows into the P&L.
  - Line 2 = `principal_amount` → sub-category `Loans → Car Loan`
    → balance sheet; reduces the loan's outstanding balance; never touches P&L.
  - The two lines sum to the transaction amount, so the transaction
    reconciles against the bank statement.
- The schedule row's `matched_txn_id` is set, so it is not matched again.
- The pre-split transaction appears on **Transactions** (pending review)
  **already split** — the user confirms the split rather than categorizing from
  scratch.

**Match against each row's own `emi_amount` — never a single assumed figure.**
Real schedules are irregular: the first instalment and the last instalment
commonly differ from the standard EMI (a lender's schedule might run a
₹41,593 first instalment, then 37 instalments of ₹47,216, then a ₹47,201
final one). The matcher must compare a transaction against the `emi_amount`
of each *individual* schedule row. A matcher that hardcodes "the EMI is
₹47,216" will silently fail to match the very first and very last payments.
The two-table model already stores `emi_amount` per row precisely so this
works — do not "optimize" it away.

### Why this is code and NOT AI — read this before "improving" it

Matching a ₹50,000 debit to "the March row of the loan schedule" is **not a
judgement call — it is a lookup**. The schedule already states March = ₹10,000
interest / ₹40,000 principal. The transaction is a ₹50,000 debit on a date
near March. Plain arithmetic matches them with 100% reliability and zero
latency.

Routing this through the AI would:

- add cost and latency for no benefit;
- introduce a small but real chance the model "reasons" its way to an ₹11,000
  / ₹39,000 split instead of *reading* the ₹10,000 / ₹40,000 from the schedule.

This number lands on a tax return. It must be the boring, deterministic
lookup, every single month. **AI reads the document. Code does the matching.**

### Drift detection — why pre-extracting the schedule pays off

Because the schedule is known in advance, the app knows what each month's EMI
*should* be. Code flags the cases that do not match cleanly:

- an EMI slightly off the expected amount (rounding, or a floating-rate reset);
- a month with **no** matching EMI (a missed payment?);
- **two** EMIs in one month.

These are surfaced to the user as "does not match the schedule — please look."
This drift detection is the entire reason the schedule is pre-extracted rather
than splits being guessed transaction-by-transaction. A guessed split has
nothing to be wrong *against*; a scheduled split does.

### Floating-rate loans

If the loan has a floating interest rate, the schedule changes whenever the
rate resets. The app supports **re-amortizing from month N** with a new rate,
keeping the already-matched history intact. Do not hard-code a fixed schedule
as immutable — Indian car loans commonly reset.

### The upcoming EMI — a query, not a feature

"Your next EMI: ₹47,216 due 07/06/2026" requires no new code or stored state.
It is just a query against the schedule: *the schedule rows for this loan
where `matched_txn_id` is null, ordered by `due_date`, take the first one.*
Because every paid instalment has its `matched_txn_id` filled in by Job 2, the
first still-unmatched row is by definition the next one due. The same query,
extended, tells you whether an instalment is overdue (its `due_date` is in the
past and it is still unmatched). The dashboard reads this directly.

---

## What this flow produces

- **Deductible interest** for the year — the sum of all interest lines —
  feeds the P&L (`flow-pnl-calculation.md`).
- **Principal repaid** — feeds the balance sheet by reducing the loan's
  outstanding balance — and correctly appears *nowhere* on the P&L.
- The loan's **closing outstanding balance** — feeds the balance sheet and the
  ITR assets/liabilities schedule (`flow-balance-sheet.md`, `flow-tax-prep.md`).
  Each schedule row's stored `closing_balance` is also an independent
  cross-check: after the first N EMIs are matched, the loan's computed
  outstanding balance should equal row N's `closing_balance`.

Note: the car *asset* itself, and its depreciation, are a separate matter
handled in `flow-balance-sheet.md`. This flow is only about the *loan*.

---

## Generality — why "car-only for now" is fine

Nothing here is car-specific. Job 1 (read a schedule document) and Job 2
(match EMIs, split) work identically for a home loan, an equipment loan, a
business loan. The car is simply the first instance of a general "Loan"
pattern. Build it general; just do not build speculative loan types that do
not yet exist. The only asset-type-specific thing in the whole app is the
*depreciation rate*, and that lives in `flow-balance-sheet.md`, not here.

---

## What this flow assumes

- The loan exists as a liability Account.
- The amortization schedule has been extracted (Job 1 done before Job 2 can
  run).

## What this flow deliberately does NOT do

- It does not let the AI compute or adjust a split.
- It does not handle depreciation of the asset bought with the loan — that is
  `flow-balance-sheet.md`.
- It does not decide whether the interest is tax-deductible or by how much —
  that depends on the asset's `business_use_pct` and is applied in
  `flow-tax-prep.md`.
