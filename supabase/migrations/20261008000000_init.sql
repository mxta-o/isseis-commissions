-- Issei's Comms — initial schema.
-- Run once in the Supabase SQL editor (or `supabase db push` if you adopt the CLI later).
--
-- Access model: the Express API talks to Postgres with the service-role key, which bypasses RLS.
-- RLS is enabled with NO policies on every table, so the public anon key (shipped to browsers
-- for admin login) can't read or write anything directly.

-- ── Types ────────────────────────────────────────────────────────────────────

-- No `approved`: approving moves a request straight to awaiting_payment.
-- `cancelled` covers both rejection and an expired payment window; cancellation_reason says which.
create type commission_status as enum (
  'pending_review',
  'awaiting_payment',
  'in_progress',
  'completed',
  'cancelled'
);

create type commission_file_type as enum ('reference', 'final');

-- ── commissions ──────────────────────────────────────────────────────────────

create table commissions (
  -- Doubles as the public tracking ID: random, unguessable, never shown alongside the email.
  id                  uuid primary key default gen_random_uuid(),
  -- Client-generated once per form session. A retried submit with the same key returns the
  -- existing row instead of creating a duplicate.
  idempotency_key     uuid not null unique,
  email               text not null check (email = lower(email)),
  title               text not null check (char_length(title) between 1 and 100),
  description         text not null check (char_length(description) between 1 and 750),
  tier                text not null check (tier in ('sketch', 'full', 'scene')),
  status              commission_status not null default 'pending_review',
  -- Set on approval. Snapshotted so later tier-price changes don't touch approved commissions.
  price_cents         integer check (price_cents > 0),
  payment_deadline    timestamptz,
  paid_at             timestamptz,
  cancellation_reason text check (char_length(cancellation_reason) <= 500),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Invariants the state machine must uphold; the DB refuses rows that break them.
  constraint cancelled_has_reason
    check (status <> 'cancelled' or cancellation_reason is not null),
  constraint approved_has_price_and_deadline
    check (status not in ('awaiting_payment', 'in_progress', 'completed')
           or (price_cents is not null and payment_deadline is not null)),
  constraint paid_has_paid_at
    check (status not in ('in_progress', 'completed') or paid_at is not null)
);

-- Spam rule: "1 request per email per 30 min" looks up the newest row for an email.
create index commissions_email_created_at_idx on commissions (email, created_at desc);
-- Admin board groups by status.
create index commissions_status_idx on commissions (status);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger commissions_set_updated_at
  before update on commissions
  for each row execute function set_updated_at();

-- ── commission_files ─────────────────────────────────────────────────────────

-- Only the storage path lives here; the bytes live in the `commissions` storage bucket at
-- {commission_id}/{reference|final}/{n}-{filename}.
create table commission_files (
  id            uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions (id) on delete cascade,
  storage_path  text not null unique,
  file_type     commission_file_type not null,
  uploaded_at   timestamptz not null default now()
);

create index commission_files_commission_id_idx on commission_files (commission_id);

-- ── email_verifications ──────────────────────────────────────────────────────

-- One pending code per email. Sending a new code replaces the old one. The row is deleted
-- once a commission is created with it.
create table email_verifications (
  email      text primary key check (email = lower(email)),
  code_hash  text not null,          -- sha256 of the 6-digit code; the code itself is never stored
  expires_at timestamptz not null,
  attempts   integer not null default 0,
  sent_at    timestamptz not null default now()  -- for the per-email resend cooldown
);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table commissions         enable row level security;
alter table commission_files    enable row level security;
alter table email_verifications enable row level security;

-- ── Storage ──────────────────────────────────────────────────────────────────

-- Private bucket: files are only reachable through short-lived signed URLs the API creates.
-- 50 MB cap leaves room for final deliverables; the API enforces 10 MB on reference uploads.
insert into storage.buckets (id, name, public, file_size_limit)
values ('commissions', 'commissions', false, 52428800)
on conflict (id) do nothing;
