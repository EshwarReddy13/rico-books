# Flow: Transaction Import & Categorization

> Last reviewed against code: not yet built — design blueprint.
> Read `architecture.md` first. This flow assumes you understand the data
> model (especially Transaction vs Transaction Line) and the governing
> principle: **AI proposes, code computes, human confirms.**

This is the most-used flow in the app. It is how money gets *in* and gets
*categorized*. It spans four pages: Import, Review, Transactions, and it
writes data the Dashboard and Reports read.

---

## Trigger

The user uploads a bank statement file on the **Import** page.

**v1 supports CSV / Excel only.** These are structured and reliable. PDF
statement import is deferred to a later version (PDF is harder to parse
reliably); the data model and flow do not change when PDF is added — only the
parser in Step 1 gains a new input type.

### The expected CSV / Excel format

v1 targets the standard HDFC Bank statement export. Its columns map to the
data model as follows:

| Statement column   | Maps to                          | Notes                                   |
|--------------------|----------------------------------|-----------------------------------------|
| Date               | `transaction.date`               | drives everything date-related          |
| Narration          | `transaction.raw_description`    | the AI cleans this into a description    |
| Chq./Ref.No.       | `transaction.reference_no`       | often blank; one input to the fingerprint |
| Value Dt           | (stored, minor)                  | the transaction date is what is used     |
| Withdrawal Amt.    | `amount` + `direction = debit`   | a value here → this is a debit           |
| Deposit Amt.       | `amount` + `direction = credit`  | a value here → this is a credit          |
| Closing Balance    | `transaction.closing_balance`    | feeds the fingerprint AND reconciliation |

A row has a value in *either* Withdrawal *or* Deposit — that column tells the
parser both the amount and the direction. Other banks lay columns out
differently; the parser uses the **bank account profile** (Settings) to know
which column is which.

---

## The steps, in order

### Step 1 — Parse the file into raw rows

**What happens:** the uploaded CSV/Excel file is turned into a list of raw
rows. Each row carries: date, amount, direction (from which of Withdrawal /
Deposit is populated), raw description (the Narration), reference number, and
closing balance.

**Where:** server side, the import parser. The parser uses the bank account
profile to map columns.

**Why it is its own step:** parsing is purely mechanical. No AI, no
categorization. Getting clean rows out of a file is hard enough on its own; do
not entangle it with anything else.

### Step 2 — De-duplicate via the transaction fingerprint

**What happens:** for each parsed row, the app computes a **fingerprint** — a
hash (e.g. SHA-256) over `source_account_id + date + amount + raw_description
+ reference_no + closing_balance`. De-duplication is then handled by the
database: there is a **unique index on `(source_account_id, fingerprint)`**,
so inserting a row either succeeds (genuinely new) or is rejected by the
constraint (already present).

**Where:** server side. The fingerprint is computed in app code; the
uniqueness decision is made by the database index.

**Why this design:** the user re-uploads overlapping statements often
(statements straddle month-ends). The fingerprint + unique index handles this
correctly and at any scale — an indexed lookup is effectively instant on a
table of any size. **Do not** detect duplicates by scanning existing rows, and
**do not** rely on a "is this date after the latest transaction" heuristic:
date alone cannot establish uniqueness (a re-uploaded later statement, or a
second bank account with overlapping dates, breaks it). The closing balance is
deliberately in the fingerprint because a statement's running balance is
effectively unique per transaction — see `architecture.md` §3.4.

### Step 3 — Create the import batch and the transactions

**What happens:** the genuinely-new rows are saved as Transaction records
with `status = pending_review`, all tagged with one `import_batch_id`. At this
point they exist in the database but **do not yet affect the P&L or balance
sheet** — only `confirmed` transactions do.

**Where:** server side.

### Step 4 — AI categorization pass

**What happens:** the pending transactions are sent to the AI to get proposed
categorizations. For each transaction the AI proposes: a sub-category, an
entity, a human-readable description, and a confidence score (0–1).

This is the **"AI proposes"** part of the governing principle. The AI is
reading messy bank text and drafting suggestions. It is not deciding anything
final.

**Two-tier design — most transactions should never reach the AI:**

- **Tier 1 — rules / memory (no AI).** First, code checks each transaction
  against previously-confirmed categorizations. If the user has categorized
  "RAZORPAY PAYOUT" before, the merchant is matched and the category is filled
  in instantly, deterministically, with high confidence. After the first month
  or two this handles the large majority of transactions — recurring SaaS,
  payouts, bank charges.
- **Tier 2 — the AI model.** Only the genuinely new or ambiguous transactions
  fall through to the Claude API.

**How the AI call is made (important for performance):**

- **Batched.** All Tier-2 transactions go in **one request** — "here are N
  transactions, return a JSON array of N categorizations" — not one API call
  per transaction. One round-trip instead of N.
- **Synchronous**, normal API call. Not the async Batch API (that is cheaper
  but can take minutes; wrong for an interactive flow).
- **Prompt caching** on the static context: the category tree, the entity
  list, the instructions, and a set of few-shot examples drawn from the user's
  own recent confirmed categorizations. Mark that block with `cache_control`.
  Every statement after the first reuses it — cheaper and faster.
- The model is **Claude Haiku 4.5**. Categorization is classification; it does
  not need a frontier model. Haiku is the cheapest current model and the
  fastest.
- The payload per transaction is tiny: date, amount, direction, raw
  description. The response is strict JSON (instruct the model to return JSON
  only, no preamble) so it parses cleanly.

**Description generation:** the description is proposed in this *same* call,
not as a separate step — confirming category and description must be one
action for the user, or every transaction costs two clicks. The description
should be generated with the proposed category as context (a transaction
known to be foreign income gets a smarter description than the raw text alone
would yield).

### Step 5 — EMI / loan auto-match (no AI)

**What happens:** before the transactions reach the human, code checks each
one against open rows in every loan's amortization schedule. If a transaction
matches an expected EMI — right amount, right date window — it is pre-flagged
as a loan EMI and **pre-split into two lines** (interest line + principal
line) using the figures already in the schedule.

**Where:** server side. **This is plain code, not AI** — see `flow-emi-split.md`
for the full reasoning. Matching a ₹50,000 debit to "the March schedule row"
is a lookup, not a judgement.

**Why it is a step in the import flow:** so that when an EMI reaches the
Review queue it arrives *already split*, and the user just confirms the split
rather than categorizing from scratch.

### Step 6 — The Review queue (human confirmation)

**What happens:** every pending transaction is presented to the user on the
**Review** page with its AI-proposed (or rule-matched, or EMI-pre-split)
categorization. The user confirms or overrides.

This is the **"human confirms"** part of the principle. **A transaction is not
real for P&L purposes until it is confirmed here.**

**UX requirements:**

- Designed as a **fast, keyboard-driven queue** — approve / change / next —
  not a spreadsheet to scroll. On a 200-line statement this is the difference
  between tolerable and painful.
- The **confidence score drives the UX**: high-confidence items can be
  bulk-approved; low-confidence items get individual attention.
- Confirming category, sub-category, entity, and description is **one action**.
- For an EMI transaction, the user confirms the *pre-computed split* rather
  than picking a flat category.

**Learning loop:** when the user *overrides* a suggestion, the app records the
rule ("this merchant → this category/entity"). Next month that merchant is
matched at Tier 1 and never reaches the AI. The Review queue shrinks over time
as the app learns. The learned rules are viewable and editable in Settings.

### Step 7 — Write confirmed transactions; they become "real"

**What happens:** on confirmation, the transaction's `status` becomes
`confirmed` and its Transaction Lines are written (one line for a simple
transaction, multiple for a split). From this moment the transaction is
included in the P&L and balance sheet computations.

Every confirmation and every later edit is recorded in the **Audit Log**.

---

## After the flow

Confirmed transactions appear in the **Transactions** ledger — the full
searchable list, where any transaction can be edited later (edits go through
the Audit Log). The **Dashboard** "N awaiting confirmation" count drops to
zero. The P&L and balance sheet now reflect the new data.

---

## What this flow assumes

- Bank account profiles are configured in Settings (so the parser knows the
  column layout).
- Opening balances have been set (see `architecture.md` §4.1).
- Loan schedules already exist for any active loans (so Step 5 can match) —
  see `flow-emi-split.md`.

## What this flow deliberately does NOT do

- It does not compute any P&L or balance-sheet number — that is
  `flow-pnl-calculation.md` and `flow-balance-sheet.md`.
- It does not let the AI finalize anything — every AI output is a proposal
  awaiting human confirmation.
- It does not let the AI compute the EMI split — that is code, against the
  schedule.
