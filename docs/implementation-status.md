# Implementation status

> **Last reviewed against code:** 2026-05-19  
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

**Not built yet:** categorization batch (`POST /api/categorize/run` or similar),
prompt assembly, or wiring Gemini into the import flow.

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

Main categories are **seeded** on `prisma db seed` (Income, Expense, Owner
Contribution, Assets, Loans, Transfer).

### Import (slice 1 — parse → preview → confirm)

| Step | Status | Code |
|------|--------|------|
| 1 Parse CSV/Excel | Done | `lib/import/parse-spreadsheet.ts`, `POST /api/import/parse` |
| 2 Fingerprint + duplicate flag | Done | `lib/import/fingerprint.ts`, `lib/import/mark-duplicates.ts` |
| 3 Save `pending_review` transactions | Done | `POST /api/import/confirm`, `lib/import/import-mutations.ts` |
| 4 AI categorization | **Not started** | — |
| 5 EMI auto-match | **Not started** | — |
| 6 Review / confirm UI | **Not started** | Transactions table is read-only |
| 7 Write lines + `confirmed` | **Not started** | — |

**HDFC column layout** (default bank profile): Date, Narration, Chq./Ref.No.,
Value Dt, Withdrawal Amt., Deposit Amt., Closing Balance.

**UI:** Dashboard → Import → `ImportWizard` / `ImportDialog`; bank account
picker; template download `GET /api/import/template`.

**Amounts:** stored as paise (`BigInt`); import preview uses `formatInrFromPaise`
(no USD conversion on import).

### Transactions page

- Loads real rows from DB: `lib/transactions/load-transactions.ts`
- Filters: All / Pending review / Confirmed
- Summary cards: live counts and INR totals
- Category column: `formatLineCategoryLabel()` (shows main-only or `Main → Sub`)
- Imported rows show **Uncategorized** until lines + categories exist

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
| Assets page | Bank accounts from DB | Non-bank asset types not in CRUD UI |
| Liabilities page | Card grid | Placeholder accounts from `placeholder-accounts.ts` |
| Reports | Page shell | P&L, net worth, ITR figures |
| Entity filter in nav | Loads entities | Not yet filtering transactions by entity |
| Learned rules (Tier 1) | Table in schema | No API, no matching logic, no UI |

---

## Not started (v1 backlog)

- AI categorization pass (Gemini batch JSON)
- Learned categorization rules (Tier 1)
- EMI / loan schedule matching on import
- Transaction review queue UX (confirm, override, bulk approve)
- Writing `transaction_lines` + `status = confirmed`
- Audit log writes on line edits
- P&L and balance sheet computation from confirmed data
- Liabilities + loans CRUD and amortization UI
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
| `/api/import/template` | Download `.xlsx` template |
| `/api/import/parse` | Multipart parse + preview |
| `/api/import/confirm` | Persist selected rows |
| `/api/ai/ping` | Gemini connectivity test |

---

## Environment variables

See [`.env.example`](../.env.example):

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`
- `GEMINI_API_KEY`, `GEMINI_MODEL` (optional)

---

## Next milestone: categorization

Recommended order (see `flow-transaction-import.md` Step 4+):

1. Load pending transactions + category tree + entities for prompt context.
2. Tier 1: match `learned_categorization_rules` (optional first slice).
3. Tier 2: `generateGeminiJson()` with strict schema — proposals may use
   `mainCategoryId` **or** `subCategoryId` per line rules above.
4. Persist draft lines on `transaction_lines` (`confidence`, `description`).
5. Review UI on `/transactions` → confirm → `status = confirmed`.
