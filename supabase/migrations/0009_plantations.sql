-- Plantation manager: cinnamon and tea planters keep their own records.
--
--   plantations              one per estate or land, owned by a user
--   plantation_harvests      what was picked or peeled, in kg
--   plantation_transactions  money in (sales) and out (costs)
--   plantation_activities    field work: fertilizing, pruning, peeling...
--   plantation_workers       the people who work the land, with a daily wage
--   plantation_work_days     a worker's day: task, kg plucked, wage, paid or not
--
-- Private to the owner, like plans (0001): only the server reads and writes
-- them with the service-role key, scoping every query to the session's uid.
-- RLS is on with no policies and the browser roles hold no privileges.
--
-- Every record repeats the owner's id and references (plantation_id,
-- user_id) together, so a record can never hang off someone else's
-- plantation. Deleting the account or the plantation removes everything.

create table public.plantations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  crop text not null check (crop in ('cinnamon', 'tea')),
  area_ha numeric not null check (area_ha > 0 and area_ha <= 100000),
  location text not null default '',
  planted_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (id, user_id)
);

create index plantations_user_created_idx on public.plantations (user_id, created_at desc);

create table public.plantation_harvests (
  id uuid primary key default gen_random_uuid(),
  plantation_id uuid not null,
  user_id uuid not null,
  harvested_on date not null,
  product text not null,
  quantity_kg numeric not null check (quantity_kg > 0),
  block text not null default '',
  grade text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  foreign key (plantation_id, user_id)
    references public.plantations (id, user_id) on delete cascade
);

create index plantation_harvests_idx on public.plantation_harvests (plantation_id, harvested_on desc);

create table public.plantation_transactions (
  id uuid primary key default gen_random_uuid(),
  plantation_id uuid not null,
  user_id uuid not null,
  occurred_on date not null,
  kind text not null check (kind in ('income', 'expense')),
  category text not null,
  amount numeric not null check (amount > 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  foreign key (plantation_id, user_id)
    references public.plantations (id, user_id) on delete cascade
);

create index plantation_transactions_idx on public.plantation_transactions (plantation_id, occurred_on desc);

create table public.plantation_activities (
  id uuid primary key default gen_random_uuid(),
  plantation_id uuid not null,
  user_id uuid not null,
  done_on date not null,
  type text not null,
  block text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  foreign key (plantation_id, user_id)
    references public.plantations (id, user_id) on delete cascade
);

create index plantation_activities_idx on public.plantation_activities (plantation_id, done_on desc);

create table public.plantation_workers (
  id uuid primary key default gen_random_uuid(),
  plantation_id uuid not null,
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  daily_wage numeric not null default 0 check (daily_wage >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, plantation_id),
  foreign key (plantation_id, user_id)
    references public.plantations (id, user_id) on delete cascade
);

create index plantation_workers_idx on public.plantation_workers (plantation_id, name);

-- A work day names a worker of the same plantation: (worker_id,
-- plantation_id) must match a worker row, not just any worker's id
create table public.plantation_work_days (
  id uuid primary key default gen_random_uuid(),
  plantation_id uuid not null,
  user_id uuid not null,
  worker_id uuid not null,
  worked_on date not null,
  task text not null,
  kg_plucked numeric check (kg_plucked is null or kg_plucked >= 0),
  wage numeric not null check (wage >= 0),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (plantation_id, user_id)
    references public.plantations (id, user_id) on delete cascade,
  foreign key (worker_id, plantation_id)
    references public.plantation_workers (id, plantation_id) on delete cascade
);

create index plantation_work_days_idx on public.plantation_work_days (plantation_id, worked_on desc);

alter table public.plantations enable row level security;
alter table public.plantation_harvests enable row level security;
alter table public.plantation_transactions enable row level security;
alter table public.plantation_activities enable row level security;
alter table public.plantation_workers enable row level security;
alter table public.plantation_work_days enable row level security;

revoke all on table
  public.plantations,
  public.plantation_harvests,
  public.plantation_transactions,
  public.plantation_activities,
  public.plantation_workers,
  public.plantation_work_days
from anon, authenticated;
