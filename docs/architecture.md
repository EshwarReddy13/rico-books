# Architecture

> **Last reviewed against code:** 2026-05-17 — data model and flows below are the
> design blueprint; **§5.1** describes the UI shell that exists today (Phase 0
> skeleton). Business logic (import, AI, real aggregates) is not wired yet.

This document is the entry point. Read it before any flow doc. It explains
**what the app is**, the **core data model**, the **one governing principle**,
and the **tech stack**. The `flow-*.md` files describe specific journeys
through the system and assume you have read this.

---

## 1. What this app is

A single-user financial application with two jobs:

1. Produce a **categorized Profit & Loss statement** from bank transactions.
2. Maintain a **balance sheet** (assets, liabilities, net worth).

Both outputs feed a third job — preparing the figures needed to file an
**Indian Income Tax Return (ITR)**. The app prepares figures; it does not
file. Filing happens on the government e-filing portal.

### What v1 includes

- Bank statement import — **CSV / Excel only** (the standard HDFC export
  format; see `flow-transaction-import.md`)
- AI-assisted categorization with mandatory human confirmation
- A category tree (main categories + sub-categories)
- Transaction splits (one bank transaction → multiple categorized lines)
- Loan handling: amortization schedule, EMI auto-matching, principal/interest split
- Asset register with depreciation
- Balance sheet / net worth
- A tax profile + a dual presumptive-vs-actual tax computation
- Reports and data export

### What v1 deliberately excludes (deferred, not forgotten)

- **PDF statement import** — v1 imports CSV / Excel only. PDF statements are
  harder to parse reliably and are deferred. The data model and flows do not
  change when PDF is added — only the import parser gains a new input type.
- **GST** — the user files GST separately for now. The data model leaves room
  (a transaction *can* carry a tax field) but no GST features are built.
- **Multi-currency** — foreign income is entered directly in the base currency
  (INR). The app does not fetch FX rates or store original-currency amounts.
  This is a known limitation: the INR value of a foreign receipt is a manual
  judgement the user makes at entry time.
- **Backup** — no automated backup system. (Export *is* included — see below —
  but scheduled/automatic backup is not.)

If you are extending the app, these are the most likely "v2" additions.
Do not let them silently creep into v1.

---

## 2. The one governing principle

> **AI proposes. Code computes. The human confirms.**

This sentence governs every flow in the app. Internalize it before writing
any code, because it is the rule a new contributor is most tempted to break.

- **AI proposes.** The AI model (Claude Haiku 4.5) is used to *read* messy
  inputs and *draft* suggestions: it reads raw bank statement text and proposes
  a category, a sub-category, an entity, and a human-readable description. It
  reads a loan schedule document and extracts the table. These are all
  *proposals* — drafts placed in front of the human.

- **Code computes.** Every number that matters is calculated by plain,
  deterministic code: P&L totals, depreciation, the principal/interest split
  of an EMI, loan outstanding balances, net worth, tax figures. **A language
  model never computes a number that lands in the books or on a tax return.**
  Models are probabilistic; a model can produce a figure that is 4% wrong and
  look completely confident. Arithmetic is not the AI's job.

- **The human confirms.** Nothing the AI proposes counts until the user has
  explicitly confirmed it. An imported transaction is not part of the P&L
  until the user has approved its category on the Transactions page (pending
  review queue). This is what
  makes the numbers trustworthy at filing time.

When in doubt about whether to use the AI for something, ask: *"Is this
reading/drafting, or is this calculating?"* Reading and drafting → AI.
Calculating → code.

---

## 3. The core data model

The entire app is built on a small number of objects. Every screen is just a
different view onto these. Understand these nine and you understand the app.

### 3.1 Entity

A business or context that transactions belong to. Examples: the agency, the
US entity, the family-company role.

| Field            | Notes                                            |
|------------------|--------------------------------------------------|
| id               | primary key                                      |
| name             | display name                                     |
| description      | free text — context for the AI (see below)       |
| created_at       |                                                  |

Entity is a **tag** on a transaction, not a separate set of books. There is
one shared ledger; "viewing the agency" means filtering by entity. This makes
cross-entity questions ("total software spend everywhere") a one-line query.

`description` is read by the AI as context during categorization. A line like
"digital marketing agency, foreign clients, receives USD payouts via Razorpay"
tells the model what an incoming payment to this entity probably is before it
ever sees a transaction — it materially improves categorization accuracy.

### 3.2 Category (main) and Sub-category

A two-level tree. **Main categories** carry the most important property in the
whole data model — whether they flow into the P&L.

**Main category**

| Field        | Notes                                                     |
|--------------|-----------------------------------------------------------|
| id           | primary key                                               |
| name         | e.g. "Income", "Expense", "Owner Contribution", "Assets", "Loans", "Transfer" |
| description  | free text — context for the AI                            |
| kind         | enum: `pnl` or `balance_sheet` — see below                |
| pnl_sign     | enum: `income`, `expense`, or `null` — only set when kind=`pnl` |

`kind` answers: *does a transaction under this category affect profit & loss,
or the balance sheet?* `Income` and `Expense` are `pnl`. `Owner Contribution`,
`Assets`, `Loans`, `Transfer` are `balance_sheet`. **This single field is what
keeps the P&L correct** — if "Assets" is ever misclassified as `pnl`, buying a
car would show up as an expense. Guard it.

`pnl_sign` tells the P&L engine whether a P&L category adds to income or to
expenses. It is an explicit field by deliberate choice: the sign could be
derived from a transaction's debit/credit direction, but an explicit field is
unambiguous and never wrong. The cost is that it must be kept consistent with
the category's intent — a small, accepted maintenance burden.

A few main categories are **seeded automatically** when the app is first set
up (Income, Expense, Owner Contribution, Assets, Loans, Transfer), so the
category tree is never empty on day one.

**Sub-category**

| Field            | Notes                                                       |
|------------------|-------------------------------------------------------------|
| id               | primary key                                                 |
| main_category_id | foreign key → main category                                 |
| name             | e.g. "Foreign Income", "Software & Subscriptions", "Car Loan" |
| description      | free text — context for the AI                              |
| linked_record_id | nullable — see below                                        |
| linked_record_type | nullable — `asset` or `liability`                         |

`description` on both main and sub-category is read by the AI as context
during categorization, same purpose as the Entity description.

`linked_record_id` is the subtle part. Most sub-categories are plain buckets.
But sub-categories under the `Assets` and `Loans` main categories **point at a
specific record** in the asset/liability register. "Loans → Car Loan" is not
just a label; it links to *the* Car Loan liability so EMI transactions hit the
right amortization schedule. See `flow-emi-split.md`.

### 3.3 Account

A real-world place money sits or is owed. Two kinds: **assets** and
**liabilities**. The car is an asset; the car loan is a liability; a bank
account is an asset.

| Field            | Notes                                                       |
|------------------|-------------------------------------------------------------|
| id               | primary key                                                 |
| name             | "VW Virtus", "VW Virtus Car Loan", "HDFC Current A/c"       |
| account_kind     | enum: `asset` or `liability`                                |
| asset_type       | enum: `vehicle`, `computer`, `furniture`, `bank`, ... (drives depreciation rate) |
| opening_value    | value as of the opening date — **see Opening Balances**     |
| opening_date     | the date `opening_value` is true                            |
| business_use_pct | 0–100; for shared assets, the deductible fraction           |
| depreciation_rate| % per year; defaulted from `asset_type`, editable           |

For a **liability** that is a loan, the loan header and its amortization
schedule live in their own tables (see 3.6 Loan and 3.7 Loan Schedule Row).

### 3.4 Transaction

A single line of money movement, as it appears on a bank statement.

| Field              | Notes                                                     |
|--------------------|-----------------------------------------------------------|
| id                 | primary key                                               |
| date               | transaction date                                          |
| amount             | total amount of the bank line (always positive)           |
| direction          | enum: `debit` or `credit`                                 |
| raw_description    | the unmodified text from the bank statement (the "Narration" column) |
| reference_no       | the bank's cheque / reference number, if any              |
| closing_balance    | the running account balance after this transaction        |
| source_account_id  | which bank account this came from                         |
| fingerprint        | a hash used for duplicate detection — see below           |
| import_batch_id    | which upload this came in on (enables "undo this import") |
| status             | enum: `pending_review`, `confirmed`                       |
| created_at         |                                                           |

A transaction **is not categorized directly**. Categorization lives on its
*lines* (next). A simple transaction has one line; a split transaction (e.g. an
EMI) has several. This is critical — see 3.5.

A transaction is only included in the P&L and balance sheet when
`status = confirmed`.

**Duplicate detection — the `fingerprint` field.** The same statement, or
overlapping statements, will be re-uploaded; the app must not double-count.
The reliable, scalable way to detect duplicates is **not** a date heuristic
and **not** a scan of existing rows — both are fragile or slow. Instead:

- On import, the app computes a hash (e.g. SHA-256) over a set of fields that
  together fingerprint a transaction:
  `source_account_id + date + amount + raw_description + reference_no + closing_balance`.
- That hash is stored in `fingerprint`, and there is a **unique database index
  on `(source_account_id, fingerprint)`**.
- Importing a transaction is then just an insert: the database accepts it (new)
  or rejects it on the unique constraint (duplicate). An indexed lookup is
  effectively instant whether the table holds 1,000 or 1,000,000 rows — no
  scanning, no date logic.

`closing_balance` is deliberately part of the fingerprint: a statement's
running balance is the cumulative sum of everything before it, so it is
effectively unique per transaction. Two genuinely different transactions
almost never share the same date, amount, *and* closing balance — and even a
legitimate same-day, same-amount repeat will have a different closing balance
because the first one already moved it. This makes the fingerprint robust.

`reference_no` alone is **not** sufficient as the key: the bank leaves it
blank for many transactions (charges, interest credits) and it is only unique
within one bank. It is one input to the fingerprint, not the fingerprint.

`import_batch_id` tags every transaction with the upload it arrived on. It is
**not** how de-duplication works (that is the fingerprint); it exists so a
whole import can be reviewed or undone as a unit.

### 3.5 Transaction Line

A categorized portion of a transaction. **The line, not the transaction, is
the unit of categorization.**

| Field            | Notes                                                       |
|------------------|-------------------------------------------------------------|
| id               | primary key                                                 |
| transaction_id   | foreign key → transaction                                   |
| amount           | this line's portion; all lines of a txn must sum to txn.amount |
| sub_category_id  | foreign key → sub-category                                  |
| entity_id        | foreign key → entity                                        |
| description      | the AI-generated, human-confirmed, freely-editable text     |
| confidence       | 0–1, the AI's confidence (used to drive review UX on Transactions) |

A normal ₹14,000 software payment = one transaction, one line.
A ₹50,000 car EMI = one transaction, **two lines**: a ₹10,000 line under
`Expense → Loan Interest`, and a ₹40,000 line under `Loans → Car Loan`. The
two lines sum to ₹50,000, so the transaction reconciles against the bank.

**Why split at the line level and not just have multiple transactions:** the
bank shows one ₹50,000 debit. Reconciliation (see `flow-balance-sheet.md`)
requires the app's record of that day to also show ₹50,000. One transaction
that *expands* into lines preserves that; two fake transactions would not.

### 3.6 Loan

The header record for a loan — its identity and its lifetime totals. There is
**one** Loan record per loan, and it owns many Loan Schedule Rows (3.7). The
header and the schedule are separated because they have different shapes: the
header is information that appears once (one agreement number, one tenure),
the schedule is information that repeats once per instalment.

| Field                   | Notes                                                  |
|-------------------------|--------------------------------------------------------|
| id                      | primary key                                            |
| liability_account_id    | foreign key → the Account (`account_kind = liability`) — the loan as it appears on the balance sheet |
| agreement_no            | the lender's loan identifier (e.g. "168092625")        |
| lender                  | the bank / lender (e.g. "HDFC Bank Ltd")               |
| loan_type               | descriptive (e.g. "Auto Loan")                         |
| amount_financed         | principal borrowed — this is the loan's **opening outstanding balance** |
| tenure                  | number of instalments                                  |
| frequency               | instalment spacing (e.g. "monthly")                    |
| total_payable           | sum of all instalments — a **validation checksum**     |
| total_interest          | sum of all interest — a **validation checksum**        |
| schedule_generated_date | the date the lender issued this schedule               |

Three fields do non-obvious work:

- `amount_financed` is the **starting point for the balance sheet**. A loan's
  outstanding balance = `amount_financed` − principal repaid so far (see
  `flow-balance-sheet.md`).
- `total_payable` and `total_interest` are **checksums**. After the schedule
  rows are extracted (3.7), code sums the rows and confirms the sums equal
  these stored totals — `Σ principal = amount_financed`, `Σ interest =
  total_interest`, `Σ emi = total_payable`. The lender printed the answer key;
  these fields are how the app grades its own extraction. See `flow-emi-split.md`.
- `frequency` drives the EMI-matcher's date-tolerance window and the
  "upcoming EMI" calculation.

### 3.7 Loan Schedule Row

One row of a loan's amortization table — one record per instalment. The whole
set of rows is created once, at loan setup, by the AI reading the loan
document (see `flow-emi-split.md`), and verified against the Loan checksums.

| Field            | Notes                                                       |
|------------------|-------------------------------------------------------------|
| id               | primary key                                                 |
| loan_id          | foreign key → Loan (3.6)                                    |
| installment_no   | the lender's instalment number (store it; don't recompute)  |
| due_date         | scheduled date of this instalment                           |
| emi_amount       | total instalment for this row — **may differ row to row**   |
| principal_amount | principal portion                                           |
| interest_amount  | interest portion — this is the tax-deductible part          |
| closing_balance  | loan outstanding principal after this instalment            |
| matched_txn_id   | nullable — set to the real transaction's id once matched    |

The schedule is the **source of truth for every EMI split**. Code matches real
transactions against it; the AI never re-derives a split.

`matched_txn_id` is the link between the *plan* (the schedule) and *reality*
(bank transactions). Null = this instalment is not yet paid. It powers "which
EMIs are done", "which is next", and "is one overdue" — all as queries, no
extra stored state needed. (Whether a row is `upcoming`/`paid`/`overdue` is
derived from `matched_txn_id` and `due_date` vs. today; it is not a stored
field unless a future need makes one worthwhile.)

`emi_amount` is stored **per row** because real schedules are irregular — the
first and last instalments commonly differ from the standard amount. The
EMI-matcher must match against each row's own `emi_amount`, never against a
single assumed figure. See `flow-emi-split.md`.

### 3.8 Tax Profile

The set of tax decisions, recorded once per financial year. These are
*entered* by the user (ideally after consulting a CA), not guessed by the app.

| Field                  | Notes                                                |
|------------------------|------------------------------------------------------|
| financial_year         | e.g. "2025-26" (Indian FY: April–March)              |
| itr_form               | e.g. "ITR-3"                                         |
| presumptive_enabled    | boolean — is 44AD presumptive taxation elected?      |
| presumptive_rate       | % of gross receipts treated as profit, if enabled    |
| schedules_enabled      | which ITR schedules apply (FSI, FA, AL, ...)         |

See `flow-tax-prep.md`. The most important thing this object enables is the
**dual computation** — the app calculates tax both ways (presumptive and
actual) and shows the user the gap.

### 3.9 Audit Log

Every change to a transaction line (category change, description edit, split
adjustment) is recorded: what changed, old value, new value, when. Cheap to
add now, painful to retrofit, and valuable at filing time if a figure is ever
questioned.

| Field        | Notes                                            |
|--------------|--------------------------------------------------|
| id           | primary key                                      |
| entity_table | which table the changed row belongs to           |
| entity_id    | which row                                        |
| field        | which field changed                              |
| old_value    |                                                  |
| new_value    |                                                  |
| changed_at   |                                                  |

---

## 4. Two cross-cutting concepts that touch every flow

### 4.1 Opening balances

The app starts mid-life, not at zero. On day one the bank accounts already
hold money, the car loan already has an outstanding balance, the car already
has a depreciated value carried from a prior year.

There is a **one-time opening-balances setup**: the user states, as of a
chosen date, every account's value. All flows assume this has been done.
If the app assumed everything started at zero, net worth and the depreciation
base would be wrong from day one. This is the single most common thing people
forget — do not skip it.

### 4.2 The financial year boundary

Indian FY runs **April to March**. This is structural, not cosmetic:

- Depreciation is annual: a year's **closing WDV** (written-down value)
  becomes the **next year's opening WDV**.
- The presumptive-vs-actual tax choice is made per financial year.
- Statements get re-uploaded that straddle a year-end.

Every transaction therefore belongs to a financial year. Reports respect the
boundary. There is a clean **year-end roll-forward** (see `flow-balance-sheet.md`).
Do not treat dates as one flat undifferentiated timeline.

---

## 5. The pages

Each page is a view onto the objects in section 3. Listed with the flow doc
that governs its behavior.

### 5.1 UI shell (as built — Phase 0 skeleton)

Authenticated app routes live under `app/(dashboard)/`. Every dashboard page
shares the same chrome:

| Piece | Role | Code |
|-------|------|------|
| **Side nav** | Fixed-height left rail; does not scroll with page content | `components/dashboard/side-nav.tsx` |
| **Dashboard shell** | Scrollable `main`, page header, currency context | `components/dashboard/dashboard-shell.tsx`, `dashboard-header.tsx` |
| **Page titles** | Title + subtitle from pathname | `lib/dashboard/page-headers.ts` |

**Layout rules (enforced in code):** outer shell `h-dvh overflow-hidden`; only
`main` scrolls (`overflow-y-auto`). No page-level horizontal scroll — wide
tables use a local `overflow-x-auto` container.

**Redirects:** `/review` → `/transactions` (review queue lives on
Transactions, not a separate route). `/import` → `/` (import entry on
Dashboard when built).

#### Navigation (as built)

Top to bottom in the side nav:

1. **Rico Books** — brand link to `/` (Dashboard home).
2. **Entity selector** — dropdown above the workflow links
   (`components/dashboard/nav-entity-selector.tsx`). Filters which entity's
   data the app shows once wired to the database. Today uses placeholder
   entities; the last menu item is **Add new entity** (flow not built yet).
3. **Workflow:** Dashboard (`/`), Transactions (`/transactions`), Reports
   (`/reports`).
4. **Divider + “Books” label:** Categories (`/categories`), Assets (`/assets`),
   Liabilities (`/liabilities`).
5. **Bottom:** Settings (`/settings`), dark mode toggle.

Nav item definitions: `lib/dashboard/nav-items.ts`.

**Deferred in UI (still in the data model / flows):** a separate Entities page
or tab, and a learned-rules editor on Categories. Entity switching is only in
the side-nav selector for now.

#### Page skeletons (as built)

| Route | What exists today |
|-------|-------------------|
| `/` | Dashboard home layout (placeholder metrics / actions) |
| `/transactions` | Filters **All** / **Pending review** / **Confirmed**; import button; table with mock rows |
| `/reports` | Report grid layout (placeholder charts and figures) |
| `/categories` | Main-category cards (DB-backed with seed fallback), period strip, sub-category breakdown, mix chart, recent list — **amounts and recent txns use placeholder data** until computation is wired |
| `/assets`, `/liabilities` | Card grid per account + **Add new** card (DB or placeholders); detail view deferred |
| `/settings` | Profile (read-only), display (currency + theme), sign out |

**Categories page layout (as built):** horizontal main-category cards (select
one) → summary strip for the period → 60/40 grid: sub-category breakdown (left),
category mix + recent transactions (right). No tab bar; no Entities or Rules
panels on this page.

### 5.2 Navigation (target design)

Same grouping as §5.1 — the structure is intentional and not expected to
change when features are wired:

- **Workflow** (top): Dashboard, Transactions, Reports — day-to-day use.
- **Entity context** (above workflow): which business/tag filters the session.
- **Books** (below a divider): Categories, Assets, Liabilities — chart of
  accounts and registers; configured occasionally.
- **Settings** (bottom, above the theme toggle): profile and general app
  preferences only. Nothing that defines the books lives here.

### 5.3 Page map (target behavior)

| Page          | Purpose                                                                 | Governing flow doc            |
|---------------|-------------------------------------------------------------------------|-------------------------------|
| Dashboard     | P&L summary, net worth, statement import (Actions), "N awaiting confirmation" | (reads from all), `flow-transaction-import.md` |
| Transactions  | Review queue (`pending_review`) + confirmed ledger; categorize, confirm, edit | `flow-transaction-import.md`  |
| Reports       | P&L statement, net worth, ITR-prep view, tax profile for the year, export | `flow-pnl-calculation.md`, `flow-tax-prep.md` |
| Categories    | Main + sub-category tree only (CRUD, descriptions for AI context)      | `architecture.md` §3.2         |
| Assets        | Asset accounts (bank, vehicle, …), bank import profiles, opening balances | `flow-balance-sheet.md`       |
| Liabilities   | Liability accounts, loans, amortization schedules, EMI setup             | `flow-emi-split.md`, `flow-balance-sheet.md` |
| Settings      | User profile, preferences, auth-related options (not ledger data)         | —                             |

**Entity** records (§3.1) are created/edited via the side-nav entity selector
(and a future add-entity flow), not a dedicated page. **Learned categorization
rules** (Tier 1 in `flow-transaction-import.md`) will get a management UI later;
they are not on Categories in the current skeleton.

---

## 6. Tech stack

The v1 priorities, in the user's stated order, are: **(1) solid data model,
(2) easy for another coder to pick up, (3) cheap to run, (4) ship fast.** The
stack below is chosen to honor that order — it favors correctness and
familiarity over novelty.

### 6.1 Shape of the system

A hosted web app built on **Next.js (App Router)** — one framework that
provides both the React frontend and the server-side backend in a single
codebase and a single deployment:

```
  Browser (React, client components)
        │  HTTPS
        ▼
  Next.js server (route handlers / server actions)  ──>  PostgreSQL
        │
        └──>  Claude API (Haiku 4.5)
```

The browser never talks to the database or the Claude API directly. All data
access, all AI calls, and all computation happen in **server-side code** —
Next.js route handlers and server actions. This matters for security (see 6.6).

Next.js was chosen over a Vite SPA + separate Node backend because one
framework, one codebase, one deployment directly serves priority (2) — easy
for another coder — and priority (3) — cheap to run. It is also a stack the
user already knows.

**The discipline Next.js demands:** because it blurs the client/server line,
there must be a hard rule — anything touching the database, the Claude API
key, or a computation lives **only** in server-side code (route handlers,
server actions, server components), **never** in a client component. With
that rule enforced, Next.js is the right call. Without it, secrets leak into
the browser bundle.

### 6.2 Frontend (Next.js client side)

- **React** with **TypeScript**. TypeScript is non-negotiable given priority
  (1): a typed schema shared across the whole app means the data model is
  enforced by the compiler, not by hope.
- **Tailwind** for styling, with a headless component library (e.g. Radix) —
  the user has done Tailwind work before, so this is familiar ground.
- State: keep it simple. A server-state library (TanStack Query) for data
  fetching, or Next.js's own server-action data flow; local component state
  for everything else. No heavy global store is needed for a single-user app.

### 6.3 Backend (Next.js server side)

- The backend is **not a separate service** — it is the server side of the
  Next.js app: route handlers and server actions, in TypeScript. Same language
  and same repo as the frontend keeps the shared types real and lowers the
  barrier for a second coder.
- A typed query layer / ORM (e.g. Prisma or Drizzle). This is doing real work
  for priority (1): the schema is defined once, migrations are generated, and
  queries are type-checked. Drizzle is lighter and closer to SQL; Prisma is
  more batteries-included. Either is defensible — pick one and document it.
- The server side owns: parsing uploads, computing transaction fingerprints,
  calling the Claude API, running every computation (P&L, depreciation, EMI
  matching, tax), and writing the audit log.

### 6.4 Database

- **PostgreSQL.** Priority (1) again. The data model in section 3 is
  relational — transactions have lines, lines reference categories and
  entities, loans have schedule rows. A relational database with real foreign
  keys and constraints enforces that integrity at the storage layer. Money and
  tax data should not live in a loosely-typed document store.
- Store money as integers in the smallest currency unit (paise), or as a
  fixed-precision decimal type. **Never store money as a floating-point
  number** — floats lose precision and your P&L will be off by rounding dust.
- A **unique index on `(source_account_id, fingerprint)`** on the transaction
  table is what makes duplicate detection both correct and fast (see §3.4).
  Use the database constraint; do not hand-roll duplicate checking in app code.

### 6.5 The AI integration

- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) via the Anthropic API.
- The API key lives **only on the backend server**, in an environment
  variable, never in the frontend bundle. A key in frontend code is visible
  to anyone who opens the browser dev tools.
- Calls are **batched** — many transactions per request, not one call per
  transaction — and use **prompt caching** for the static context (the
  category tree, the instructions, the few-shot examples). See
  `flow-transaction-import.md` for the request shape.
- Use a normal synchronous call, **not** the asynchronous Batch API — the
  Batch API is cheaper but can take minutes, which is wrong for an interactive
  "upload and review now" flow.

### 6.6 Hosting & security

Because this is a hosted app holding the user's full financial picture and
tax basis, security is designed in from the start, not patched on:

- **Authentication** even though there is one user. The app must not be
  openable by anyone who finds the URL. **Neon Auth** (managed Better Auth on
  Neon) handles sign-in: users, sessions, and OAuth config live in the
  `neon_auth` schema in the same Neon project as Postgres. The Next.js app
  uses `@neondatabase/auth` (server SDK + `proxy.ts` route protection). App
  business data stays in the public schema via Prisma; auth is not modeled in
  `prisma/schema.prisma`. Google OAuth and email flows can be enabled in the
  Neon Console without custom auth infrastructure.
- The **database is not publicly reachable** — only the Next.js server
  connects to it.
- **HTTPS everywhere.**
- **Encryption at rest** for the database where the host supports it.
- The **Claude API key** is server-side only (restated because it matters).
- Secrets (DB credentials, Neon Auth URL/cookie secret, API key) live in
  environment variables / a secrets manager, never in the repo.

A reasonable hosting shape: a managed Postgres instance + a small app server,
on a single provider. Keep it boring — priority (3), cheap to run, and
priority (2), easy for the next person.

### 6.7 Documentation discipline

The `/docs` folder (this file plus the `flow-*.md` files) is part of the
codebase. The rule:

> **If a pull request changes how a flow works, it updates that flow's doc in
> the same pull request.**

Out-of-date docs are worse than no docs — they mislead. Each flow doc carries
a "last reviewed against code" line at the top. Code entry points carry a
one-line pointer comment, e.g. `// Transaction import flow — see
docs/flow-transaction-import.md`, so a coder starting in the code is sent to
the doc and vice versa.

---

## 7. Where to go next

- To understand how money gets *in* and gets *categorized*: `flow-transaction-import.md`
- To understand the car / loan / EMI machinery: `flow-emi-split.md`
- To understand how the P&L number is produced: `flow-pnl-calculation.md`
- To understand assets, depreciation, net worth, year-end: `flow-balance-sheet.md`
- To understand the ITR figure preparation: `flow-tax-prep.md`
