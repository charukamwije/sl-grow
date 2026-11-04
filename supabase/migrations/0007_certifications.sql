-- Aswedduma Certified applications, made in the app by signed-in users and
-- worked through by admins:
--
--   applied -> in_review -> on_hold -> rejected | certified
--
-- A certified application gets a certificate code (ASW-C-XXXXXX), public at
-- /verify/<code>, valid until expires_at. Moving it away from certified keeps
-- the code, so a shared link then says the certificate is no longer valid.

create table public.certification_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ref text not null unique,
  track text not null check (track in ('home-grower', 'seeds', 'plantation')),
  name text not null,
  phone text not null,
  location text not null,
  notes text not null default '',
  status text not null default 'applied'
    check (status in ('applied', 'in_review', 'on_hold', 'rejected', 'certified')),
  -- Shown to the applicant, e.g. why the application is on hold
  admin_note text not null default '',
  certificate_code text unique,
  certified_at timestamptz,
  expires_at timestamptz,
  status_updated_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- A certified application always has its code and expiry
  check (status <> 'certified' or (certificate_code is not null and expires_at is not null))
);

create index certification_applications_status_idx
  on public.certification_applications (status, created_at desc);

create index certification_applications_user_idx
  on public.certification_applications (user_id, created_at desc);

-- One open application per person and path; after a decision they may apply again
create unique index certification_applications_one_open
  on public.certification_applications (user_id, track)
  where status in ('applied', 'in_review', 'on_hold');

alter table public.certification_applications enable row level security;

revoke all on table public.certification_applications from anon, authenticated;
