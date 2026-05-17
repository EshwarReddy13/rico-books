# Rico Books

Single-user finance & ITR app — bank transactions → categorized P&L and balance sheet → ITR figure prep.

**Governing principle:** AI proposes. Code computes. The human confirms.

## Documentation

Design docs live in [`/docs`](./docs/). Start with [`docs/architecture.md`](./docs/architecture.md).

Blueprint reading guide: [`docs/README-blueprint.md`](./docs/README-blueprint.md).

## Stack (Phase 0)

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **PostgreSQL** on [Neon](https://neon.tech)
- **Prisma 7** — app data (transactions, categories, …)
- **[Neon Auth](https://neon.com/docs/auth/overview)** — managed sign-in (Better Auth); users live in the `neon_auth` schema

## Prerequisites

- Node.js **22** (see `.nvmrc`)
- npm
- A Neon project with **Postgres** and **Auth** enabled (AWS regions)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   copy .env.example .env
   ```

   Fill in:

   - `DATABASE_URL` — Neon Postgres URL (`?sslmode=require` recommended)
   - `NEON_AUTH_BASE_URL` — from Neon Console → Branch → **Auth** → Configuration
   - `NEON_AUTH_COOKIE_SECRET` — `openssl rand -base64 32`
   - Optional: `ALLOWED_SIGNUP_EMAIL` — only this address may sign up (recommended for single-user)

3. Enable **Auth** in the Neon Console for your project/branch if you have not already.

4. Apply Prisma migrations (app tables only; auth is managed by Neon):

   ```bash
   npm run db:migrate
   ```

5. Create your account (first time only):

   - Open [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up)
   - Or sign in at `/auth/sign-in` if the account already exists

6. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — unauthenticated visits redirect to `/auth/sign-in`.

   **Safari:** if cookies fail on HTTP, use `npm run dev -- --experimental-https` and open `https://localhost:3000`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:generate` | Regenerate Prisma client |

## Phase status

- **Phase 0 (in progress):** skeleton — Next.js, Prisma, Neon Auth
- **Phase 1+:** see `.cursor/.cursorrules` and `docs/architecture.md`
