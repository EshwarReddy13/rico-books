# Flow: Transaction Import & Categorization

> **Last reviewed against code:** 2026-05-19  
> **Built:** Steps 1–4 and 6–7 (through import, AI categorize, human confirm).
> **Not built:** Step 5 (EMI auto-match), Tier 1 learned rules.
> (AI, EMI match, review/confirm, lines). See `implementation-status.md`.  
> Review queue UX is on `/transactions` (`/review` redirects there).  
> Read `architecture.md` first. This flow assumes you understand the data
> model (especially Transaction vs Transaction Line) and the governing
> principle: **AI proposes, code computes, human confirms.**

This is the most-used flow in the app. It is how money gets *in* and gets
*categorized*. It spans the **Dashboard** (upload entry point), the
**Transactions** page (review queue + ledger), and writes data that **Reports**
read.

---

## Trigger

The user taps **Import** in the **Dashboard → Actions** row. A dialog opens
for bank account selection and file upload. There is no separate Import page;
`/import` redirects to the dashboard.

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
| Value Dt           | `transaction.value_date`         | stored; transaction date is primary      |
| Withdrawal Amt.    | `amount` + `direction = debit`   | a value here → this is a debit           |
| Deposit Amt.       | `amount` + `direction = credit`  | a value here → this is a credit          |
| Closing Balance    | `transaction.closing_balance`    | feeds the fingerprint AND reconciliation |

A row has a value in *either* Withdrawal *or* Deposit — that column tells the
parser both the amount and the direction. Other banks lay columns out
differently; the parser uses the **bank account profile** on the **Assets**
page to know which column is which.

**Code:** `lib/import/parse-spreadsheet.ts`, `lib/import/load-column-mapping.ts`,
`POST /api/import/parse`, `POST /api/import/confirm`, UI `components/dashboard/import-wizard.tsx`.

---

## The steps, in order

### Step 1 — Parse the file into raw rows ✅ built

**What happens:** the uploaded CSV/Excel file is turned into a list of raw
rows. Each row carries: date, amount, direction (from which of Withdrawal /
Deposit is populated), raw description (the Narration), reference number, and
closing balance.

**Where:** server side, the import parser. The parser uses the bank account
profile to map columns.

**Why it is its own step:** parsing is purely mechanical. No AI, no
categorization. Getting clean rows out of a file is hard enough on its own; do
not entangle it with anything else.

### Step 2 — De-duplicate via the transaction fingerprint ✅ built

**What happens:** for each parsed row, the app computes a **fingerprint** — a
hash (SHA-256) over `source_account_id + date + amount + raw_description +
reference_no + closing_balance`. Rows that match an existing
`(source_account_id, fingerprint)` are flagged in the preview as duplicates and
are not inserted again on confirm.

**Where:** server side. `lib/import/fingerprint.ts`, unique index on
`transactions (source_account_id, fingerprint)`.

**Why this design:** the user re-uploads overlapping statements often
(statements straddle month-ends). The fingerprint + unique index handles this
correctly and at any scale — an indexed lookup is effectively instant on a
table of any size. **Do not** detect duplicates by scanning existing rows, and
**do not** rely on a "is this date after the latest transaction" heuristic:
date alone cannot establish uniqueness (a re-uploaded later statement, or a
second bank account with overlapping dates, breaks it). The closing balance is
deliberately in the fingerprint because a statement's running balance is
effectively unique per transaction — see `architecture.md` §3.4.

### Step 3 — Create the import batch and the transactions ✅ built

**What happens:** the user-selected, non-duplicate rows are saved as Transaction
records with `status = pending_review`, all tagged with one `import_batch_id`.
At this point they exist in the database but **do not yet affect the P&L or
balance sheet** — only `confirmed` transactions do. **No transaction lines**
are written yet — category shows as Uncategorized on `/transactions`.

**Where:** server side. `lib/import/import-mutations.ts`.

### Step 4 — AI categorization pass ✅ built

**What happens:** the pending transactions are sent to the AI to get proposed
categorizations. For each transaction the AI proposes:

- **Category:** either a **sub-category id** (main implied) **or** a **main
  category id only** when no sub is needed (e.g. Owner Contribution, Transfer).
  Main-only and sub on the same line are **mutually exclusive** — see
  `lib/transactions/line-category.ts`.
- **Entity** (optional)
- **Human-readable description**
- **Confidence** score (0–1)

Draft **transaction lines** are written (or updated) with these proposals. The
transaction stays `pending_review` until the user confirms in Step 6.

This is the **"AI proposes"** part of the governing principle. The AI is
reading messy bank text and drafting suggestions. It is not deciding anything
final.

**Two-tier design — most transactions should never reach the AI:**

- **Tier 1 — rules / memory (no AI).** ⏳ not built. First, code checks each
  transaction against `learned_categorization_rules` and previously-confirmed
  patterns. If the user has categorized "RAZORPAY PAYOUT" before, the merchant
  is matched and the category is filled in instantly, deterministically, with
  high confidence.
- **Tier 2 — the AI model.** Only the genuinely new or ambiguous transactions
  fall through to the Gemini API.

**How the AI call is made (important for performance):**

- **Provider:** **Google Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite` by
  default). SDK: `@google/genai`. Setup: `docs/ai-setup.md`.
- **Batched.** All Tier-2 transactions go in **one request** — return a JSON
  array of N categorizations — not one API call per transaction.
- **Structured output.** Use `generateGeminiJson()` with `responseMimeType:
  application/json` and `responseJsonSchema` so the response parses reliably
  (`lib/ai/gemini-client.ts`).
- **Synchronous**, normal API call. Not a long-running async batch job (wrong for
  an interactive "upload and review now" flow).
- **Credit ≠ Income.** The prompt tells the model that `direction: credit` only
  means a bank deposit — refunds, reversals, and chargebacks should use **Expense**
  (`pnl_sign: expense`) when they offset a spend, not Income by default. See
  `lib/ai/categorization-instructions.ts`.
- **Context in the prompt:** full category tree (mains + subs), entity list,
  main-category `kind` / `pnl_sign`, descriptions, and few-shot examples from
  recent confirmed categorizations when available.
- The payload per transaction is tiny: date, amount, direction, raw
  description. Each array element includes `mainCategoryId` and/or
  `subCategoryId`, `entityId`, `description`, `confidence`.

**Description generation:** the description is proposed in this *same* call,
not as a separate step — confirming category and description must be one
action for the user, or every transaction costs two clicks. The description
should be generated with the proposed category as context (a transaction
known to be foreign income gets a smarter description than the raw text alone
would yield).

**Planned route:** e.g. `POST /api/categorize/run` (after import or on demand
from Transactions).

### Step 5 — EMI / loan auto-match (no AI) ⏳ not built

**What happens:** before the transactions reach the human, code checks each
one against open rows in every loan's amortization schedule. If a transaction
matches an expected EMI — right amount, right date window — it is pre-flagged
as a loan EMI and **pre-split into two lines** (interest line + principal
line) using the figures already in the schedule.

**Where:** server side. **This is plain code, not AI** — see `flow-emi-split.md`
for the full reasoning. Matching a ₹50,000 debit to "the March schedule row"
is a lookup, not a judgement.

**Why it is a step in the import flow:** so that when an EMI reaches the
Transactions review queue it arrives *already split*, and the user just
confirms the split rather than categorizing from scratch.

### Step 6 — Review on Transactions (human confirmation) ✅ built

**What happens:** every pending transaction is presented to the user on the
**Transactions** page (filter: **Pending review**) with its AI-proposed (or
rule-matched, or EMI-pre-split) categorization. The user confirms or overrides.

**Today:** `CategorizeWorkspace` on `/transactions` — category picker, AI
suggestion badge, entity filter from side nav, bulk approve ≥ 90% confidence,
keyboard shortcuts (Enter, ↑↓, s).

This is the **"human confirms"** part of the principle. **A transaction is not
real for P&L purposes until it is confirmed here.**

**UX requirements:**

- Designed as a **fast, keyboard-driven queue** — approve / change / next —
  not a spreadsheet to scroll. On a 200-line statement this is the difference
  between tolerable and painful.
- The **confidence score drives the UX**: high-confidence items can be
  bulk-approved; low-confidence items get individual attention.
- Confirming category, sub-category (when used), main-only category, entity,
  and description is **one action**.
- For an EMI transaction, the user confirms the *pre-computed split* rather
  than picking a flat category.

**Learning loop:** when the user *overrides* a suggestion, the app records the
rule ("this merchant → this category/entity"). Next month that merchant is
matched at Tier 1 and never reaches the AI. The pending-review queue shrinks
over time as the app learns. A UI to view and edit learned rules is **deferred**;
the `learned_categorization_rules` table exists in the schema.

### Step 7 — Write confirmed transactions; they become "real" ✅ built

**What happens:** on confirmation, the transaction's `status` becomes
`confirmed` and its Transaction Lines are finalized (one line for a simple
transaction, multiple for a split). From this moment the transaction is
included in the P&L and balance sheet computations.

Every confirmation and every later edit is recorded in the **Audit Log**.

---

## After the flow

Confirmed transactions remain on **Transactions** (filter: **Confirmed** or
**All**) — the full searchable ledger, where any transaction can be edited
later (edits go through the Audit Log). The **Dashboard** "N awaiting
confirmation" count drops toward zero. The P&L and balance sheet now reflect
the new data. The user opens **Transactions** and filters to **Pending review**
to confirm imported items.

---

## What this flow assumes

- Bank account profiles are configured on **Assets** (so the parser knows the
  column layout). ✅ bank CRUD built
- **Entities** exist in the database. ✅ CRUD built; entity filter on txn list ⏳
- The **category tree** is maintained on **Categories**. ✅ CRUD built
- Opening balances have been set (see `architecture.md` §4.1). ⏳ partial
- Loan schedules already exist for any active loans (so Step 5 can match) —
  see `flow-emi-split.md`. ⏳ not built
- **`GEMINI_API_KEY`** in `.env` for Step 4. ✅ ping works; categorize ⏳

## What this flow deliberately does NOT do

- It does not compute any P&L or balance-sheet number — that is
  `flow-pnl-calculation.md` and `flow-balance-sheet.md`.
- It does not let the AI finalize anything — every AI output is a proposal
  awaiting human confirmation.
- It does not let the AI compute the EMI split — that is code, against the
  schedule.
