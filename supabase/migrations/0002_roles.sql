-- Roles for the admin console:
--
--   super_admin  everything an admin can do, plus changing anyone's role
--   admin        manages products and guides, sees all orders
--   member       a customer; every new sign-in starts here
--
-- Locked down like the tables in 0001: RLS on with no policies and no
-- privileges for the browser roles, so only the server (service role) can
-- read a role, let alone change one.
--
-- The first super admin is made by hand, once, after signing in:
--
--   update public.profiles set role = 'super_admin' where email = 'you@example.com';

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'member'
    check (role in ('super_admin', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Who did what in the admin console. Kept when the actor's account goes, so
-- the trail outlives it.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

revoke all on table public.profiles, public.audit_log from anon, authenticated;

-- Every new auth user gets a member profile. SECURITY DEFINER because the
-- trigger runs as the Auth service's role, which cannot write public tables.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the copied email in step when a user changes theirs at Google
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now()
  where user_id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_user_email_change() from public, anon, authenticated;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Users who signed in before this migration
insert into public.profiles (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- Changes a role and returns the new one. The check that at least one super
-- admin remains runs under a lock on every super admin row, so two demotions
-- at once cannot both pass it and leave nobody able to manage roles.
create function public.set_user_role(p_target uuid, p_role text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  current_role_value text;
  remaining integer;
begin
  if p_role not in ('super_admin', 'admin', 'member') then
    raise exception 'unknown role %', p_role using errcode = '22023';
  end if;

  perform 1 from public.profiles where role = 'super_admin' for update;

  select role into current_role_value
  from public.profiles where user_id = p_target for update;

  if current_role_value is null then
    raise exception 'no such user' using errcode = 'P0002';
  end if;

  if current_role_value = 'super_admin' and p_role <> 'super_admin' then
    select count(*) into remaining
    from public.profiles where role = 'super_admin' and user_id <> p_target;

    if remaining = 0 then
      raise exception 'the last super admin cannot be demoted'
        using errcode = 'P0001', hint = 'last_super_admin';
    end if;
  end if;

  update public.profiles set role = p_role, updated_at = now()
  where user_id = p_target;

  return p_role;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon, authenticated;
grant execute on function public.set_user_role(uuid, text) to service_role;

-- Deleting an account cascades to its profile. Refusing that delete for the
-- last super admin makes the whole account deletion fail, so nobody can leave
-- the site without anyone able to manage roles - whichever way they try.
create function public.keep_a_super_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'super_admin' then
    perform 1 from public.profiles where role = 'super_admin' for update;

    if not exists (
      select 1 from public.profiles
      where role = 'super_admin' and user_id <> old.user_id
    ) then
      raise exception 'the last super admin cannot be deleted'
        using errcode = 'P0001', hint = 'last_super_admin';
    end if;
  end if;

  return old;
end;
$$;

revoke all on function public.keep_a_super_admin() from public, anon, authenticated;

create trigger keep_a_super_admin
  before delete on public.profiles
  for each row execute function public.keep_a_super_admin();
