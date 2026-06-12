-- ============================================================
-- ADU Referral Tracking Portal — initial schema
-- (Already applied to the Mary-Portal Supabase project as
--  migration `adu_referral_portal_v3_init`. Kept here for
--  reference / reproducing the setup on a fresh project.)
-- ============================================================

-- 1. (Only needed on the Mary-Portal project) the previous app
--    version had an empty `commissions` table — moved aside.
alter table if exists public.commissions rename to commissions_legacy;

-- 2. profiles ------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'agent' check (role in ('admin', 'agent')),
  ref_code text unique,
  commission_per_contract numeric not null default 1000,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  constraint agents_need_ref_code check (role = 'admin' or ref_code is not null)
);

-- 3. leads ---------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  ref_code text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  property_address text not null,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'in_progress', 'contract_signed', 'lost')),
  created_at timestamptz not null default now()
);

create index leads_agent_id_idx on public.leads (agent_id);
create index leads_status_idx on public.leads (status);
create index leads_created_at_idx on public.leads (created_at desc);

-- 4. commissions ---------------------------------------------
create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  created_at timestamptz not null default now()
);

-- Hard guarantee: one commission per lead, even under race conditions.
create unique index commissions_one_per_lead on public.commissions (lead_id);
create index commissions_agent_id_idx on public.commissions (agent_id);

-- 5. Helper functions (security definer so RLS policies can
--    consult profiles without recursive policy evaluation) ----
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.get_agent_by_ref_code(lookup_code text)
returns table (agent_id uuid, agent_name text, agent_ref_code text)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.full_name, p.ref_code
  from public.profiles p
  where upper(p.ref_code) = upper(lookup_code)
    and p.role = 'agent'
    and p.status = 'active';
$$;

create or replace function public.is_valid_referral(p_agent_id uuid, p_ref_code text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_agent_id
      and upper(p.ref_code) = upper(p_ref_code)
      and p.role = 'agent'
      and p.status = 'active'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_agent_by_ref_code(text) to anon, authenticated;
grant execute on function public.is_valid_referral(uuid, text) to anon, authenticated;

-- Remove the default PUBLIC execute grant; only the roles above need these.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.get_agent_by_ref_code(text) from public;
revoke execute on function public.is_valid_referral(uuid, text) from public;

-- 6. Row Level Security ---------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.commissions enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- leads
create policy "Public can submit leads via valid referral"
  on public.leads for insert to anon, authenticated
  with check (status = 'new' and public.is_valid_referral(agent_id, ref_code));

create policy "Agents can view own leads"
  on public.leads for select to authenticated
  using (agent_id = auth.uid());

create policy "Admins can view all leads"
  on public.leads for select to authenticated
  using (public.is_admin());

create policy "Admins can update leads"
  on public.leads for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- commissions
create policy "Agents can view own commissions"
  on public.commissions for select to authenticated
  using (agent_id = auth.uid());

create policy "Admins can manage commissions"
  on public.commissions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Realtime: stream new leads to the admin dashboard --------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'leads'
     ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;
