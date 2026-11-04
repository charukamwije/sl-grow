-- Everything a customer owns, one row set per user:
--
--   carts    the cloud cart (FR-A-04), one row per user
--   orders   orders sent while signed in (FR-A-05)
--   plans    saved planner results (FR-A-08)
--
-- Only the server reads and writes these, with the service-role key. RLS is
-- on with no policies, and the browser roles hold no privileges, so the
-- publishable key cannot reach a single row - the browser could otherwise
-- insert an order without the server recomputing its prices (BR-21).
--
-- Every row hangs off auth.users with ON DELETE CASCADE, so deleting the
-- account removes its cart, orders and plans in the same statement.

create table public.carts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ref text,
  name text not null,
  phone text not null,
  method text not null check (method in ('pickup', 'delivery')),
  address text not null default '',
  notes text not null default '',
  items jsonb not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  people integer not null,
  space numeric not null,
  vegetables jsonb not null,
  plants jsonb not null,
  shopping jsonb not null,
  total numeric not null,
  yearly_savings numeric not null,
  created_at timestamptz not null default now()
);

create index plans_user_created_idx on public.plans (user_id, created_at desc);

alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.plans enable row level security;

revoke all on table public.carts, public.orders, public.plans
  from anon, authenticated;

-- BR-20: merge a device cart into the stored one, keeping the larger quantity
-- of each product. One upsert, so two devices merging at once serialise on
-- the row lock instead of dropping each other's items. The caller sanitises
-- the input and the result.
create function public.merge_cart(p_user uuid, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  result jsonb;
begin
  insert into public.carts as c (user_id, items)
  values (p_user, coalesce(p_items, '{}'::jsonb))
  on conflict (user_id) do update set
    items = (
      select coalesce(jsonb_object_agg(key, qty), '{}'::jsonb)
      from (
        select key, max(value::integer) as qty
        from (
          select * from jsonb_each(c.items)
          union all
          select * from jsonb_each(excluded.items)
        ) as entries
        group by key
      ) as merged
    ),
    updated_at = now()
  returning items into result;

  return result;
end;
$$;

revoke all on function public.merge_cart(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.merge_cart(uuid, jsonb) to service_role;
