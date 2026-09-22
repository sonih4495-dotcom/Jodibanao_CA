-- Phase 2: Advanced Like / Interest & Shortlist System
-- Run this in your Supabase SQL Editor

-- 1. INTERESTS TABLE (Like/Match System)
create table public.interests (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  message text, -- Optional message sent with the interest request
  decline_reason text, -- Optional reason if declined
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(from_user_id, to_user_id) -- A user can only send one active interest to another
);

-- Indexes for quick lookup
create index interests_from_idx on public.interests(from_user_id);
create index interests_to_idx on public.interests(to_user_id);
create index interests_status_idx on public.interests(status);

-- RLS for Interests
alter table public.interests enable row level security;

create policy "Users can view interests they sent or received" on interests
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send interests" on interests
  for insert with check (auth.uid() = from_user_id);

create policy "Users can update interests they received (Accept/Decline)" on interests
  for update using (auth.uid() = to_user_id or auth.uid() = from_user_id);


-- 2. SHORTLISTS TABLE (Saved Profiles / Bookmarks)
create table public.shortlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  saved_user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, saved_user_id) -- Prevent duplicate saves of the same profile
);

-- Index for loading a user's shortlists quickly
create index shortlists_user_id_idx on public.shortlists(user_id);

-- RLS for Shortlists (Strictly private)
alter table public.shortlists enable row level security;

create policy "Users can view their own shortlists" on shortlists
  for select using (auth.uid() = user_id);

create policy "Users can add to their shortlist" on shortlists
  for insert with check (auth.uid() = user_id);

create policy "Users can remove from their shortlist" on shortlists
  for delete using (auth.uid() = user_id);


-- 3. TRIGGER: AUTO-CREATE CONVERSATION ON ACCEPTED INTEREST
-- When an interest is updated to 'accepted', we automatically create a conversation thread in chat
create or replace function public.handle_accepted_interest()
returns trigger as $$
begin
  -- Only trigger if the status just changed to 'accepted'
  if new.status = 'accepted' and old.status = 'pending' then
    -- Insert a conversation if it doesn't already exist
    insert into public.conversations (user1_id, user2_id)
    values (
      least(new.from_user_id, new.to_user_id), 
      greatest(new.from_user_id, new.to_user_id)
    )
    on conflict (user1_id, user2_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to interests table
drop trigger if exists on_interest_accepted on public.interests;
create trigger on_interest_accepted
  after update on public.interests
  for each row execute function public.handle_accepted_interest();

-- Enable Realtime for pushing UI updates instantly (e.g., Confetti animations on Acceptance)
alter publication supabase_realtime add table public.interests;
