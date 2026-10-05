# CLAUDE.md — project context

Studio Client Hub: a HoneyBook-style client management app for a web design business. Single-owner-per-account, clients interact through a secret portal link.

## Stack
- Next.js 15 App Router, TypeScript, Tailwind v4 (`@theme` tokens in `src/app/globals.css`)
- Supabase: Postgres + email/password auth. Schema and RLS in `supabase/migrations/0001_init.sql`
- Stripe Checkout for invoice payment; webhook at `src/app/api/stripe/webhook/route.ts`
- Deployed on Vercel. Env vars listed in `.env.example` and README.

## Conventions
- **Server Components + Server Actions only.** No API routes except the Stripe webhook and auth callback/signout. Forms post to actions in `src/app/(app)/actions.ts` (owner) or `src/app/p/[token]/actions.ts` (portal).
- **Three Supabase clients** in `src/lib/supabase/`: `server.ts` (owner session, RLS applies), `client.ts` (browser, rarely needed), `admin.ts` (service role — only in portal/booking/webhook after validating token/slug/signature).
- **Money is integer cents** (`*_cents`). Use `money()` from `src/lib/format.ts` to display and `toCents()` to parse form input.
- **Dates:** `params` and `searchParams` are Promises (Next 15) — always `await` them.
- **UI primitives** live in `src/components/ui.tsx` (Button, Card, Field, Input, Badge, PageHeader…). Reuse them rather than adding a UI library.
- **Documents** (proposals + contracts) are Markdown-ish text rendered by `src/components/markdown.tsx` (headings, lists, bold only). Templates in `src/lib/templates.ts`.
- Pipeline stages: `lead → proposal_sent → booked → in_progress → complete` (+ `lost`). Sending a proposal auto-moves lead → proposal_sent; a client signing anything auto-moves to booked.

## Data model (tables)
profiles (1 per owner, auto-created on signup) · clients · projects (has `portal_token`) · documents (kind: proposal|contract) · invoices + invoice_items · inquiries

## Routes
- `/login`, `/dashboard`, `/clients`, `/clients/[id]`, `/clients/new`, `/projects/[id]`, `/projects/[id]/invoices/new`, `/documents/[id]`, `/invoices`, `/invoices/[id]`, `/inquiries`, `/settings`
- Portal: `/p/[token]`, `/p/[token]/doc/[docId]`, `/p/[token]/invoice/[invoiceId]`
- Public: `/book/[slug]`

## When adding a feature
1. Add columns/tables to a new migration file in `supabase/migrations/` with RLS policies.
2. Add types to `src/lib/types.ts`.
3. Add a server action, then the page.
4. Keep the client portal read-mostly; anything a client writes goes through a validated action using the admin client.

## Not yet built
Email notifications, PDF export, file uploads, multi-user teams, tests.
