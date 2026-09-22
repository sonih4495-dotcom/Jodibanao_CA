-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  gender text,
  dob date,
  religion text,
  caste text,
  mother_tongue text,
  city text,
  education text,
  profession text,
  income text,
  about_me text,
  diet text,
  smoking text,
  drinking text,
  family_type text,
  father_occupation text,
  mother_occupation text,
  siblings integer,
  pref_min_age integer,
  pref_max_age integer,
  pref_religion text,
  pref_location text,
  avatar_url text, -- For profile picture
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. Matches/Interests Table
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(sender_id, receiver_id) -- Prevent duplicate requests
);

alter table public.matches enable row level security;

create policy "Users can view their own matches" on matches
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send match requests" on matches
  for insert with check (auth.uid() = sender_id);

create policy "Users can update matches they received" on matches
  for update using (auth.uid() = receiver_id);

-- 3. Messages Table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view messages of their matches" on messages
  for select using (
    auth.uid() in (
      select sender_id from public.matches where id = match_id
      union
      select receiver_id from public.matches where id = match_id
    )
  );

create policy "Users can insert messages to their matches" on messages
  for insert with check (auth.uid() = sender_id);

-- 4. Auto-Profile Creation Trigger
-- When a new user signs up via Supabase Auth, create a blank profile mapping to their auth.users ID.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
