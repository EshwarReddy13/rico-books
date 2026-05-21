# Implementation status

> **Last reviewed against code:** 2026-05-19 (financed vehicle, schedule viewer, asset cost sync)  
> Living checklist of what is built vs planned. Update this file when a slice
> ships. Detailed behavior stays in `architecture.md` and the `flow-*.md` files.

---

## Governing principle (unchanged)

**AI proposes. Code computes. The human confirms.**

---

## AI provider (chosen)

| Item | Value |
|------|--------|
| Provider | **Google Gemini** via [`@google/genai`](https://www.npmjs.com/package/@google/genai) |
| Default model | **`gemini-3.1-flash-lite`** — cost-efficient, suited to high-volume classification |
| Env vars | `GEMINI_API_KEY`, `GEMINI_MODEL` (optional override) |
| Setup doc | [`docs/ai-setup.md`](./ai-setup.md) |
| Server code | `lib/ai/config.ts`, `lib/ai/gemini-client.ts` |
| Health check | `GET /api/ai/ping` (session required) |

**Built:** batched AI categorization (`POST /api/categorize/run`), mode prompt
(AI vs manual), batch-synced progress UI, review workspace on `/transactions`.

**Replaced in docs:** earlier blueprint text referred to Claude Haiku 4.5 /
Anthropic. The app standard is Gemini only unless that decision is revisited.

---

## Categorization model (data + rules)

Transaction lines support **main-only** or **sub-category** assignment (mutually exclusive):

| Assignment | `main_category_id` | `sub_category_id` | Example |
|--------------|-------------------|-------------------|---------|
| Main only | set | null | Owner Contribution |
| Sub (main implied) | null | set | Expense → Software & Subscriptions |
| Uncategorized | null | null | After import, before AI / manual categorize |

Helpers: `lib/transactions/line-category.ts` — `validateLineCategoryAssignment()`,
`formatLineCategoryLabel()`, `resolveLineMainCategoryId()`.

**Category tree UI:** main categories do **not** require sub-categories. Owner
Contribution can exist with zero subs.

**Still required before P&L:** at least one of main or sub on each line when
categorized; validation runs in app code when lines are written.

---

## Built

### Auth & shell

- Neon Auth (`@neondatabase/auth`), `proxy.ts` route protection
- Dashboard layout: side nav, entity selector, theme, currency toggle (display)
- API routes excluded from auth middleware redirect where noted in `proxy.ts`
  (return JSON 401 via `requireSession()` instead)

### Reference data (CRUD)

| Area | API | UI |
|------|-----|-----|
| Entities | `GET/POST /api/entities`, `PATCH/DELETE /api/entities/[id]` | Side-nav selector + form dialog |
| Main categories | `POST /api/categories/main`, `PATCH/DELETE …/[id]` | Categories tab — cards + dialog |
| Sub-categories | `POST /api/categories/sub`, `PATCH/DELETE …/[id]` | Categories tab — breakdown + dialog |
| Bank accounts (assets) | `POST /api/accounts/bank`, `PATCH/DELETE …/[id]` | Assets page — cards + dialog |
| Register assets (vehicle, etc.) | `POST /api/accounts/asset`, `PATCH/DELETE …/[id]` | Assets — auto `Assets → {name}` sub; cost sync on loan/down payment |
| Liabilities | `POST /api/accounts/liability`, `PATCH/DELETE …/[id]` | Liabilities — auto `Loans → {name}` sub; link financed asset |
| Loan header | `GET/PUT /api/accounts/liability/[id]/loan` | Liability form — loan fields + PDF autofill |
| Loan schedule | `POST /api/loans/parse-document`, `…/[loanId]/schedule/*` | PDF extract (Gemini), checksum, confirm rows |
| Asset down payments | `GET /api/accounts/asset/[id]/down-payments` | Assets — “View down payments” dialog |
| Loan schedule view | `GET /api/loans/[loanId]/schedule` | Liabilities — “View repayment schedule” dialog |

Main categories are **seeded** on `prisma db seed` (Income, Expense, Owner
Contribution, Assets, Loans, Transfer).

### Import (slice 1 — parse → preview → confirm)

| Step | Status | Code |
|------|--------|------|
| 1 Parse CSV/Excel | Done | `lib/import/parse-spreadsheet.ts`, `POST /api/import/parse` |
| 2 Fingerprint + duplicate flag | Done | `lib/import/fingerprint.ts`, `lib/import/mark-duplicates.ts` |
| 3 Save `pending_review` transactions | Done | `POST /api/import/confirm`, `lib/import/import-mutations.ts` |
| 4 AI categorization | Done | `POST /api/categorize/run`, `lib/ai/run-ai-categorization.ts` |
| 5 EMI auto-match | Done | `lib/loans/match-emi-on-import.ts` on import confirm |
| 6 Review / confirm UI | Done | `CategorizeWorkspace`, mode prompt, bulk approve |
| 7 Write lines + `confirmed` | Done | `PATCH /api/transactions/[id]`, `POST /api/transactions/bulk-confirm` |
| EMI confirm-only UI | Done | Pre-split lines read-only; “Confirm EMI” in categorize workspace |

**EMI matching:** amount must equal the schedule row’s `emi_amount` (not a fixed
global EMI); date ±10 days. Does **not** depend on categorizing to the loan sub first.
See `flow-emi-split.md`.

**HDFC column layout** (default bank profile): Date, Narration, Chq./Ref.No.,
Value Dt, Withdrawal Amt., Deposit Amt., Closing Balance.

**UI:** Dashboard → Import → `ImportWizard` / `ImportDialog`; bank account
picker; template download `GET /api/import/template`.

**Amounts:** stored as paise (`BigInt`); import preview uses `formatInrFromPaise`
(no USD conversion on import).

### Transactions page

- Loads real rows from DB: `lib/transactions/load-transactions.ts`
- Filters: All / Pending review / Confirmed
- **Entity filter:** side-nav entity filters list, summary cards, and categorize queue
- Summary cards: counts and INR totals (per selected entity)
- **Categorize workspace:** main/sub picker, AI suggestion badge, Save & confirm
- **Bulk approve:** high-confidence AI suggestions (≥ 90%) via bulk-confirm API
- **Keyboard shortcuts:** Enter save & next, ↑↓/j/k navigate, s skip
- Category column: `formatLineCategoryLabel()` (shows main-only or `Main → Sub`)
- **EMI splits:** `isEmiSplit`, per-line breakdown; `confirmOnly` save path

### Financed vehicle (asset + loan + down payment)

Full flow doc: [`flow-financed-vehicle.md`](./flow-financed-vehicle.md).

| Feature | Status | Code / UI |
|---------|--------|-----------|
| Link loan → vehicle | Done | `Loan.financed_asset_account_id`, liability form |
| Asset card shows linked loan | Done | `loadAssets`, `AccountRegisterGrid` |
| Liability card shows financed asset | Done | `loadLiabilities` |
| Computed vehicle cost (display) | Done | `computeAssetCostPaise` — down payments + `amount_financed` |
| Persist cost + as-of date | Done | `syncAssetCostFromFinancing` on loan save, schedule confirm, asset categorize |
| Outstanding loan on liability card | Done | `computeLoanOutstandingPaise` |
| Repayment schedule viewer | Done | `LoanScheduleViewDialog`, paid / linked / due per row |
| Down payments viewer | Done | `AssetDownPaymentsDialog` |
| Edit asset: type read-only | Done | `parseRegisterAssetUpdateInput` (fixes disabled select omitting `assetType`) |
| Register link on categorize | Done | `resolveLineLinkedAccountFromSub` → `linked_account_id` on confirm |

**Cost sync triggers (not on page load):** loan upsert/re-link, schedule confirm,
categorize to `Assets → {vehicle}`, asset create (no-op until data exists).

### Gemini connection

- Package installed; client wrappers; ping route
- See [`docs/ai-setup.md`](./ai-setup.md)

### Database

- Prisma 7, PostgreSQL (Neon), business schema in `prisma/schema.prisma`
- Migrations through `20260519155110_transaction_line_main_category`
- Money as `*Paise` `BigInt`; unique `(source_account_id, fingerprint)` on transactions

---

## Partially built / placeholders

| Area | What works | What is still placeholder |
|------|------------|---------------------------|
| Dashboard home | Layout, Import action | Overview metrics, analytics charts |
| Categories page | Real tree CRUD | Mix chart amounts, recent txn list |
| Assets page | Bank + register assets, linked loan, computed cost, down payments dialog | Asset invoice PDF (opening value) |
| Liabilities page | CRUD, loan header, schedule PDF, repayment viewer, outstanding balance | Re-amortize / floating rate |
| Reports | Page shell | P&L, net worth, ITR figures |
| Entity filter in nav | Loads entities, filters `/transactions` | — |
| Learned rules (Tier 1) | Table in schema | No API, no matching logic, no UI |

---

## Not started (v1 backlog)

- Learned categorization rules (Tier 1)
- Audit log writes on line edits
- P&L and balance sheet computation from confirmed data
- Tax profile + dual computation
- Export / reports data

---

## API routes (current)

| Path | Purpose |
|------|---------|
| `/api/auth/*` | Neon Auth |
| `/api/entities`, `/api/entities/[id]` | Entities |
| `/api/categories/main`, `…/main/[id]` | Main categories |
| `/api/categories/sub`, `…/sub/[id]` | Sub-categories |
| `/api/accounts/bank`, `…/bank/[id]` | Bank accounts |
| `/api/accounts/asset`, `…/asset/[id]` | Vehicles, equipment, etc. |
| `/api/accounts/asset/[id]/down-payments` | Lines linked as down payment to asset |
| `/api/accounts/liability`, `…/liability/[id]` | Liabilities + linked subs |
| `/api/accounts/liability/[id]/loan` | Loan header GET/PUT |
| `/api/loans/parse-document` | Parse amortization PDF (no loan id yet) |
| `/api/loans/[loanId]/schedule` | GET repayment schedule + match status |
| `/api/loans/[loanId]/schedule/parse`, `…/confirm` | Amortization PDF → schedule rows |
| `/api/import/template` | Download `.xlsx` template |
| `/api/import/parse` | Multipart parse + preview |
| `/api/import/confirm` | Persist selected rows |
| `/api/ai/ping` | Gemini connectivity test |
| `/api/categorize/run`, `/api/categorize/reset` | AI batch categorize, clear proposals |
| `/api/transactions`, `/api/transactions/[id]` | List, categorize, delete all (test) |
| `/api/transactions/bulk-confirm` | Bulk confirm high-confidence pending |

---

## Environment variables

See [`.env.example`](../.env.example):

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`
- `GEMINI_API_KEY`, `GEMINI_MODEL` (optional)

---

## Next milestone: Phase B (real reports)

1. Aggregate **confirmed** lines into P&L by category (entity + period).
2. Wire **Reports** page to live INR totals.
3. Optional: Tier 1 learned rules on categorize override (cheaper AI over time).
