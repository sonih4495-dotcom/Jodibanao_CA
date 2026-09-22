-- Phase: Success Stories Table
-- Run this in your Supabase SQL Editor

create table if not exists public.success_stories (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete cascade,
  couple_names text not null,
  wedding_date date,
  story text not null,
  photo_url text,
  city text,
  religion text,
  is_approved boolean default false, -- Admin must approve before showing publicly
  is_featured boolean default false,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index success_stories_approved_idx on public.success_stories(is_approved);

alter table public.success_stories enable row level security;

-- Anyone can view approved stories
create policy "Anyone can view approved success stories" on success_stories
  for select using (is_approved = true);

-- Authenticated users can submit stories
create policy "Authenticated users can submit stories" on success_stories
  for insert with check (auth.uid() is not null);

-- Enable Realtime for admin panel
alter publication supabase_realtime add table public.success_stories;
