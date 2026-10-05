# Studio Client Hub

A small, self-hosted alternative to HoneyBook for a web design business: clients, a project pipeline, proposals and contracts with e-signature, invoices paid by card through Stripe, a client portal, and a public inquiry form.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + auth) · Stripe · Vercel
- **Cost to run:** $0 on the free tiers until you're busy. Stripe takes its normal per-transaction fee.
- **No AI dependency:** this is a normal website. Nothing here calls Claude or Anthropic.

## What it does

| Owner (you) | Client |
|---|---|
| Pipeline board: lead → proposal sent → booked → in progress → complete | Private portal link per project (no login needed) |
| Clients and projects | Reads and accepts proposals with a typed e-signature |
| Proposals and contracts from editable templates | Signs contracts |
| Invoices with line items | Pays invoices by card (Stripe Checkout) |
| Inquiries from your public booking form, one click to convert to a project | Public booking form at `/book/your-slug` |

## Deploy in 5 steps

### 1. Create the database (Supabase)
1. Go to [supabase.com](https://supabase.com) → **New project** (free tier). Pick a strong database password and save it.
2. Open **SQL Editor** → **New query**, paste the contents of `supabase/migrations/0001_init.sql`, click **Run**.
3. Go to **Authentication → Providers → Email** and turn **Confirm email** off (simplest), or leave it on and make sure **Authentication → URL Configuration → Site URL** is set to your app's URL in step 4.
4. Go to **Project Settings → API Keys** and copy the **Publishable key** (`sb_publishable_…`) and the **Secret key** (`sb_secret_…`, click the eye icon to reveal it). Your **Project URL** is under **Project Settings → General** or **Data API**. Older projects show these as **anon** and **service_role** keys instead; those work too.

### 2. Set up payments (Stripe)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys** → copy the **Secret key** (`sk_test_…` for testing, `sk_live_…` for real money).
2. You'll add the webhook in step 5, after the site has a URL.

### 3. Put the code on GitHub
Create a new repository on [github.com](https://github.com) and upload this folder (or push it with git). Vercel deploys from GitHub.

### 4. Deploy (Vercel)
1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. Before clicking Deploy, open **Environment Variables** and add:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → Secret key (keep secret) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (step 5) — add after first deploy |
| `NEXT_PUBLIC_APP_URL` | Your site URL, e.g. `https://yourproject.vercel.app` (no trailing slash) |

3. Click **Deploy**. You'll get a URL like `https://yourproject.vercel.app`.
4. To use your own domain: **Settings → Domains**, add it, and create the DNS record Vercel shows you.

### 5. Connect the Stripe webhook
1. Stripe → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-SITE/api/stripe/webhook`
3. Event to listen for: `checkout.session.completed`
4. Copy the **Signing secret** (`whsec_…`) into Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy (Deployments → ⋯ → Redeploy).

That's it. Open your site, click **Create account**, then go to **Settings** to set your business name and booking-form slug.

## Day-to-day flow

1. A lead fills out `/book/your-slug` → shows up under **Inquiries**.
2. Click **Convert to project** → creates the client and a project in the **Lead** column.
3. On the project, click **+ Proposal** → edit the pre-filled template, set the total, **Mark as sent**, and send the client the **portal link** (copy button on the project page).
4. Client accepts in the portal → project moves to **Booked** automatically.
5. **+ Contract** → same flow.
6. **+ Invoice** → the deposit is pre-filled at 50% of the proposal → **Mark as sent** → client pays by card in the portal → invoice flips to **Paid** via the webhook.

## Running locally

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
```

For local Stripe webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Project structure

```
src/app/(app)/        owner dashboard (auth required): dashboard, clients, projects, documents, invoices, inquiries, settings
src/app/(app)/actions.ts   all owner-side server actions
src/app/p/[token]/    client portal (secret link, no login)
src/app/book/[slug]/  public inquiry form
src/app/api/stripe/webhook/route.ts
src/lib/supabase/     server / browser / admin (service-role) clients + middleware
src/lib/templates.ts  default proposal + contract text — edit to taste
supabase/migrations/  database schema + row-level security
```

## Security notes

- Owners only ever see their own rows (Postgres row-level security).
- The client portal uses a 48-character random token per project. Anyone with the link can view and sign that project's documents and pay its invoices — treat it like a password-protected page and only share it with the client.
- Signed documents are locked. Signature records keep name, email, timestamp and IP.
- The `service_role` key bypasses RLS: it's only used server-side for the portal, booking form and webhook after validating the request. Never expose it to the browser.

## Ideas for v2

Email notifications (Resend), PDF export of signed documents, recurring invoices, time tracking, multi-user teams, Stripe Connect so each client of yours can run their own copy.
