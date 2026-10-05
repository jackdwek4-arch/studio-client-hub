-- ============================================================
-- Studio Client Hub — initial schema
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type project_stage as enum ('lead', 'proposal_sent', 'booked', 'in_progress', 'complete', 'lost');
create type document_kind as enum ('proposal', 'contract');
create type document_status as enum ('draft', 'sent', 'signed', 'declined');
create type invoice_status as enum ('draft', 'sent', 'paid', 'void');
create type inquiry_status as enum ('new', 'converted', 'archived');

-- ---------- profiles (one per owner / business) ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  business_name text not null default 'My Studio',
  slug text unique,                       -- public booking form lives at /book/<slug>
  tagline text,
  website text,
  created_at timestamptz not null default now()
);

-- auto-create a profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, slug)
  values (new.id, new.email, 'studio-' || substr(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- clients ----------
create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now()
);
create index clients_owner_idx on clients (owner_id);

-- ---------- projects ----------
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  title text not null,
  description text,
  stage project_stage not null default 'lead',
  budget_cents integer,
  start_date date,
  portal_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_idx on projects (owner_id);
create index projects_client_idx on projects (client_id);

-- ---------- documents (proposals + contracts) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  kind document_kind not null,
  title text not null,
  body text not null default '',
  amount_cents integer,                   -- proposals: quoted total
  status document_status not null default 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signer_ip text,
  created_at timestamptz not null default now()
);
create index documents_project_idx on documents (project_id);

-- ---------- invoices ----------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  number serial,
  title text not null default 'Invoice',
  status invoice_status not null default 'draft',
  due_date date,
  currency text not null default 'usd',
  total_cents integer not null default 0,
  notes text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_project_idx on invoices (project_id);
create index invoices_owner_idx on invoices (owner_id);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_cents integer not null default 0,
  position integer not null default 0
);
create index invoice_items_invoice_idx on invoice_items (invoice_id);

-- ---------- inquiries (public booking form) ----------
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  website text,
  budget text,
  message text,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index inquiries_owner_idx on inquiries (owner_id);

-- ---------- row-level security ----------
-- Owners can only touch their own rows. Clients never hit the database
-- directly: the portal and booking form run on the server with the
-- service-role key and validate a portal token / public slug first.

alter table profiles      enable row level security;
alter table clients       enable row level security;
alter table projects      enable row level security;
alter table documents     enable row level security;
alter table invoices      enable row level security;
alter table invoice_items enable row level security;
alter table inquiries     enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own clients" on clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own projects" on projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own documents" on documents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own invoices" on invoices
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own invoice items" on invoice_items
  for all using (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id and i.owner_id = auth.uid())
  ) with check (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id and i.owner_id = auth.uid())
  );

create policy "own inquiries" on inquiries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- keep projects.updated_at fresh
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger projects_touch before update on projects
  for each row execute procedure touch_updated_at();
