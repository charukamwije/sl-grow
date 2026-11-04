-- The admin orders view (/admin/orders) lists every customer's orders, newest
-- first, and finds one by its reference. The index from 0001 starts with
-- user_id, so it only helps within one customer's history.

create index orders_created_idx on public.orders (created_at desc);

create index orders_ref_idx on public.orders (ref);
