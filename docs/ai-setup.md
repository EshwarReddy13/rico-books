# AI setup (Google Gemini)

> **Last reviewed against code:** 2026-05-19

Rico Books uses **Google Gemini** on the server only (never in the browser).
Default model: **`gemini-3.1-flash-lite`** — cost-efficient, suited to
high-volume classification and simple structured tasks.

**Status:** API client and health check are implemented. **Transaction
categorization** (batch JSON proposals) is the next build — see
`flow-transaction-import.md` Step 4 and `implementation-status.md`.

---

## Why this model

| | |
|--|--|
| Model | Gemini 3.1 Flash Lite |
| Model id (default) | `gemini-3.1-flash-lite` |
| Role | Read bank narrations, propose category / entity / description |
| Not used for | P&L totals, EMI splits, tax numbers — those are plain code |

Earlier blueprint docs mentioned Claude Haiku; the implemented stack is
**Gemini only**.

---

## 1. Get an API key

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. Create an API key for your Google account / project.
3. Copy the key (starts with `AIza…`).

---

## 2. Add to `.env`

In the project root `.env` (same file as `DATABASE_URL`):

```env
GEMINI_API_KEY=AIza...your-key-here
GEMINI_MODEL=gemini-3.1-flash-lite
```

If the model id on the AI Studio card differs (e.g. `gemini-3.1-flash-lite-preview`),
copy that exact string into `GEMINI_MODEL`.

Restart the dev server after changing `.env`:

```bash
npm run dev
```

---

## 3. Test the connection

While signed in, open in the browser:

```
http://localhost:3000/api/ai/ping
```

Expected JSON:

```json
{
  "ok": true,
  "model": "gemini-3.1-flash-lite",
  "reply": "Rico Books AI is connected."
}
```

---

## 4. Code layout

| File | Purpose |
|------|---------|
| `lib/ai/config.ts` | Reads `GEMINI_API_KEY`, `GEMINI_MODEL` |
| `lib/ai/gemini-client.ts` | `generateGeminiText()`, `generateGeminiJson()` |
| `app/api/ai/ping/route.ts` | Health check |

**Rule:** Only call Gemini from **API routes** or server modules (`lib/ai/*`).
Never import `@google/genai` in client components — the API key must stay on
the server.

`proxy.ts` excludes `/api/ai` from the auth middleware redirect; the route still
calls `requireSession()` and returns JSON 401 when logged out.

---

## 5. Planned categorization contract (Step 4)

When `POST /api/categorize/run` (or similar) is built, it will:

1. Load transactions with `status = pending_review` (and no finalized lines).
2. Run **Tier 1** learned-rule matching (when implemented).
3. Call **`generateGeminiJson()`** once for remaining rows with a schema like:

```json
{
  "proposals": [
    {
      "transactionId": "…",
      "mainCategoryId": null,
      "subCategoryId": "…",
      "entityId": "…",
      "description": "…",
      "confidence": 0.92
    },
    {
      "transactionId": "…",
      "mainCategoryId": "…",
      "subCategoryId": null,
      "entityId": null,
      "description": "Owner capital introduced",
      "confidence": 0.88
    }
  ]
}
```

**Category rules** (enforced before save — `lib/transactions/line-category.ts`):

- Set **`subCategoryId`** *or* **`mainCategoryId`**, not both.
- **Main-only** is valid (Owner Contribution, Transfer).
- **Sub** implies main via the sub's parent; do not also set `mainCategoryId`.

4. Upsert draft rows on `transaction_lines` (`confidence`, `description`).
5. User confirms on `/transactions` → `status = confirmed`.

Prompt context will include the full category tree (with `kind`, `pnl_sign`,
descriptions), entities, and recent confirmed examples.

---

## 6. Environment reference

See [`.env.example`](../.env.example) for all variables.
