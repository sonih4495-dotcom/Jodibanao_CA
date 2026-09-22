-- Phase 1: Real-Time WhatsApp Style Chat System (MIGRATION)
-- We are upgrading the existing 'messages' and 'matches' tables to the advanced WhatsApp schema

-- 1. UPGRADE MATCHES TO CONVERSATIONS
-- We rename the table to fit the 'Conversation' model, but keep existing data safe if any
alter table if exists public.matches rename to conversations;

-- Add new conversation columns (if they don't exist yet)
alter table public.conversations add column if not exists is_blocked boolean default false;
alter table public.conversations add column if not exists blocked_by uuid references public.profiles(id) on delete set null;
alter table public.conversations add column if not exists last_message_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Rename sender/receiver to user1/user2 for bidirectional real-time chats
alter table public.conversations rename column sender_id to user1_id;
alter table public.conversations rename column receiver_id to user2_id;

-- 2. UPGRADE MESSAGES TABLE
-- Link it to conversations instead of matches
alter table public.messages rename column match_id to conversation_id;

-- Add advanced WhatsApp features to Messages
alter table public.messages add column if not exists type text check (type in ('text', 'image', 'audio', 'emoji')) default 'text';
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists status text check (status in ('sent', 'delivered', 'read')) default 'sent';
alter table public.messages add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
alter table public.messages add column if not exists is_deleted boolean default false;
alter table public.messages add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- 3. MESSAGE REACTIONS TABLE
create table if not exists public.message_reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(message_id, user_id, emoji) -- Prevent duplicate identical reactions
);

alter table public.message_reactions enable row level security;

-- Drop old policies to replace them
drop policy if exists "Users can view their own matches" on public.conversations;
drop policy if exists "Users can send match requests" on public.conversations;
drop policy if exists "Users can update matches they received" on public.conversations;

drop policy if exists "Users can view messages of their matches" on public.messages;
drop policy if exists "Users can insert messages to their matches" on public.messages;

-- RLS for Conversations
create policy "Users can view their own conversations" on conversations
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can create conversations" on conversations
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can update their own conversations" on conversations
  for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- RLS for Messages
create policy "Users can view messages in their conversations" on messages
  for select using (
    auth.uid() in (
      select user1_id from public.conversations where id = conversation_id
      union
      select user2_id from public.conversations where id = conversation_id
    )
  );
create policy "Users can insert messages to their conversations" on messages
  for insert with check (
    auth.uid() = sender_id and
    auth.uid() in (
      select user1_id from public.conversations where id = conversation_id
      union
      select user2_id from public.conversations where id = conversation_id
    )
  );

create policy "Users can update messages they sent or received (for read status)" on messages
  for update using (
    auth.uid() in (
      select user1_id from public.conversations where id = conversation_id
      union
      select user2_id from public.conversations where id = conversation_id
    )
  );

-- RLS for Reactions
create policy "Users can view reactions on messages they can see" on message_reactions
  for select using (
    exists (
      select 1 from public.messages m 
      join public.conversations c on m.conversation_id = c.id
      where m.id = message_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );
create policy "Users can react to messages they can see" on message_reactions
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.messages m 
      join public.conversations c on m.conversation_id = c.id
      where m.id = message_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );
create policy "Users can remove their own reactions" on message_reactions
  for delete using (auth.uid() = user_id);

-- ENABLE REALTIME TO ACTIVATE SUPABASE WEBSOCKETS
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
