-- Phase 6 & 7: Profile Boost, Reports, Blocks, and Admin Tables
-- Run this in your Supabase SQL Editor

-- ==========================================
-- PHASE 6: PROFILE BOOST
-- ==========================================
create table if not exists public.profile_boosts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index profile_boosts_user_idx on public.profile_boosts(user_id);
create index profile_boosts_active_idx on public.profile_boosts(is_active, expires_at);

-- Add boost tracking to profiles
alter table public.profiles add column if not exists boosts_remaining integer default 1;
alter table public.profiles add column if not exists is_boosted boolean default false;
alter table public.profiles add column if not exists boost_expires_at timestamp with time zone;

alter table public.profile_boosts enable row level security;
create policy "Users can view and manage own boosts" on profile_boosts
  for all using (auth.uid() = user_id);


-- ==========================================
-- PHASE 7: TRUST & SAFETY
-- ==========================================

-- REPORTS TABLE
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason text check (reason in (
    'fake_profile', 'abusive', 'spam', 'married', 'wrong_info', 
    'inappropriate_photo', 'other'
  )) not null,
  details text,
  status text check (status in ('pending', 'reviewed', 'dismissed', 'actioned')) default 'pending',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index reports_reporter_idx on public.reports(reporter_id);
create index reports_reported_idx on public.reports(reported_id);
create index reports_status_idx on public.reports(status);

alter table public.reports enable row level security;
create policy "Users can report and view own reports" on reports
  for select using (auth.uid() = reporter_id);
create policy "Users can create reports" on reports
  for insert with check (auth.uid() = reporter_id);

-- BLOCKS TABLE
create table if not exists public.blocks (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(blocker_id, blocked_id)
);

create index blocks_blocker_idx on public.blocks(blocker_id);
create index blocks_blocked_idx on public.blocks(blocked_id);

alter table public.blocks enable row level security;
create policy "Users manage their own blocks" on blocks
  for all using (auth.uid() = blocker_id);

-- PROFILE VIEWS TABLE  
create table if not exists public.profile_views (
  id uuid default uuid_generate_v4() primary key,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index profile_views_viewed_idx on public.profile_views(viewed_id);

alter table public.profile_views enable row level security;
create policy "Allow all logged-in users to insert profile views" on profile_views
  for insert with check (auth.uid() = viewer_id);
create policy "Users can see who viewed them" on profile_views
  for select using (auth.uid() = viewed_id or auth.uid() = viewer_id);
