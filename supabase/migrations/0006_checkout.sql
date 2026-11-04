-- In-app checkout: orders are placed in the app (no WhatsApp), paid by cash
-- on delivery or bank transfer, and moved through their status by admins.
--
--   status   created -> received -> out_for_delivery -> completed, or cancelled
--   paid     separate from status; set by an admin once the money is in
--
-- Bank transfer customers can upload a photo or PDF of their transfer slip to
-- the private `payment-receipts` bucket; admins view it through a signed URL.

alter table public.orders
  add column payment_method text not null default 'cod'
    check (payment_method in ('cod', 'bank_transfer')),
  add column status text not null default 'created'
    check (status in ('created', 'received', 'out_for_delivery', 'completed', 'cancelled')),
  add column paid boolean not null default false,
  add column paid_at timestamptz,
  add column receipt_path text,
  add column receipt_uploaded_at timestamptz,
  add column status_updated_at timestamptz,
  add column updated_by uuid references auth.users (id) on delete set null;

-- The reference customers quote must name exactly one order. The plain index
-- from 0004 is replaced by this one.
drop index if exists public.orders_ref_idx;
create unique index orders_ref_key on public.orders (ref);

create index orders_status_created_idx on public.orders (status, created_at desc);

-- The shop's settings, one row. Only the bank details for now, shown to
-- customers who pay by bank transfer; super admins edit them at
-- /admin/settings.
create table public.shop_settings (
  id integer primary key default 1 check (id = 1),
  bank_name text not null default '',
  bank_branch text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  bank_note text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

alter table public.shop_settings enable row level security;

revoke all on table public.shop_settings from anon, authenticated;

-- Transfer slips show customers' bank details, so the bucket is private:
-- no public URL, only short-lived signed ones made by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
