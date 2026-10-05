# Setup status (handoff between Claude Code sessions)

Owner: jackdwek4@gmail.com. Not a developer. Keep explanations short.
Delete this file once the app is live and tested.

## Done
- `npm install` and `npm run build` pass (build fix committed on main).
- Supabase project: `https://trezvpnahbycofflqdqg.supabase.co`. Migration
  `supabase/migrations/0001_init.sql` has been run successfully (7 tables exist).
- Supabase keys are the new style: publishable `sb_publishable_...` and secret
  `sb_secret_...`. These work with the installed supabase-js. Owner has them.
- Stripe test secret key `sk_test_...` obtained. Owner has it.
- Vercel project `studio-client-hub` on team `100xweb`, production URL
  `https://studio-client-hub.vercel.app`. Auto-deploys from `main`.

## Not done (in order)
1. Vercel env vars (none added yet): NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
   NEXT_PUBLIC_APP_URL=https://studio-client-hub.vercel.app, STRIPE_WEBHOOK_SECRET.
2. Stripe webhook: endpoint `https://studio-client-hub.vercel.app/api/stripe/webhook`,
   event `checkout.session.completed`. Copy its signing secret into Vercel as
   STRIPE_WEBHOOK_SECRET.
3. Supabase Auth: turn "Confirm email" OFF (Authentication -> Sign In / Providers -> Email).
4. Redeploy on Vercel, then create the owner account at /login and test
   proposal -> contract -> invoice via the client portal link.

## How the previous session was blocked
- Network policy blocked api.stripe.com, api.supabase.com, *.supabase.co, *.vercel.app.
  The owner was asked to allow these in the environment's Network access settings.
- The Vercel connector was authorised to a personal account, not team 100xweb.
  The owner was asked to reconnect it choosing team 100xweb.
- The owner was asked to create a Supabase personal access token (sbp_...) so
  email confirmation can be switched off through the Management API.

## If access is granted, do it via APIs
- Stripe webhook: `POST https://api.stripe.com/v1/webhook_endpoints` with
  `url=<webhook url>` and `enabled_events[]=checkout.session.completed`,
  basic auth user = sk_test key. Response field `secret` is the whsec value.
- Supabase: `PATCH https://api.supabase.com/v1/projects/trezvpnahbycofflqdqg/config/auth`
  body `{"mailer_autoconfirm": true}`, bearer = sbp token.
- Vercel: use the Vercel connector (create_project_env with upsert, then
  create_deployment with deploymentId of the latest production deployment).
- Ask the owner to paste the three keys again; .env.local is gitignored and
  does not survive between sessions.

## If access is not granted
Walk the owner through the dashboards step by step, one website at a time.
