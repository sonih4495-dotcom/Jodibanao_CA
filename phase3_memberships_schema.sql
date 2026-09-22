-- Phase 3: Premium Membership System
-- Run this in your Supabase SQL Editor

-- 1. MEMBERSHIPS TABLE
create table public.memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  plan text check (plan in ('free', 'silver', 'gold', 'platinum')) default 'free',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index
create index memberships_user_id_idx on public.memberships(user_id);

-- RLS
alter table public.memberships enable row level security;
create policy "Users can view their own membership" on memberships
  for select using (auth.uid() = user_id);
create policy "Users can update their own membership" on memberships
  for update using (auth.uid() = user_id);
-- Service role (your backend) can insert
create policy "Service role can insert memberships" on memberships
  for insert with check (true);

-- 2. PAYMENTS TABLE (Audit trail for every Razorpay payment)
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null, -- Stored in paise (INR) e.g. 249900 = ₹2499
  currency text default 'INR',
  plan text check (plan in ('silver', 'gold', 'platinum')) not null,
  status text check (status in ('created', 'captured', 'failed')) default 'created',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_order_id_idx on public.payments(razorpay_order_id);

-- RLS
alter table public.payments enable row level security;
create policy "Users can view their own payments" on payments
  for select using (auth.uid() = user_id);
create policy "Service role can insert/update payments" on payments
  for all with check (true);

-- 3. AUTO SEED: Create a free membership row when a new profile is created
-- Extend existing handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile row
  insert into public.profiles (id, first_name, last_name, religion, caste, mother_tongue, city, education, profession, income, about_me, diet, smoking, drinking, family_type, father_occupation, mother_occupation, siblings, pref_min_age, pref_max_age, pref_religion, pref_location, gender, dob)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'religion',
    new.raw_user_meta_data->>'caste',
    new.raw_user_meta_data->>'mother_tongue',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'education',
    new.raw_user_meta_data->>'profession',
    new.raw_user_meta_data->>'income',
    new.raw_user_meta_data->>'about_me',
    new.raw_user_meta_data->>'diet',
    new.raw_user_meta_data->>'smoking',
    new.raw_user_meta_data->>'drinking',
    new.raw_user_meta_data->>'family_type',
    new.raw_user_meta_data->>'father_occupation',
    new.raw_user_meta_data->>'mother_occupation',
    (new.raw_user_meta_data->>'siblings')::int,
    (new.raw_user_meta_data->>'pref_min_age')::int,
    (new.raw_user_meta_data->>'pref_max_age')::int,
    new.raw_user_meta_data->>'pref_religion',
    new.raw_user_meta_data->>'pref_location',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'dob')::date
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name;

  -- Auto-create FREE membership row
  insert into public.memberships (user_id, plan, is_active)
  values (new.id, 'free', true)
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- For existing users who don't have a membership row yet, seed them
insert into public.memberships (user_id, plan, is_active)
select id, 'free', true from public.profiles
on conflict (user_id) do nothing;
