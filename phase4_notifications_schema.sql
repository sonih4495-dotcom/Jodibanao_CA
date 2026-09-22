-- Phase 4: In-App Notifications System
-- Run this in your Supabase SQL Editor

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in (
    'interest_received', 'interest_accepted', 'mutual_match',
    'new_message', 'profile_viewed', 'membership_expiry', 'system'
  )) not null,
  title text not null,
  body text not null,
  data jsonb,        -- Extra payload e.g. { "from_user_id": "...", "conversation_id": "..." }
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_is_read_idx on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can mark their own notifications as read" on notifications
  for update using (auth.uid() = user_id);

-- Allow service role to insert notifications for any user
create policy "Service role can insert notifications" on notifications
  for insert with check (true);

-- Enable Realtime (for notification bell to update instantly)
alter publication supabase_realtime add table public.notifications;

-- =========================================================
-- TRIGGER: Create notification when an Interest is received
-- =========================================================
create or replace function public.handle_new_interest_notification()
returns trigger as $$
declare
  sender_name text;
begin
  -- Get sender's name
  select first_name || ' ' || coalesce(last_name, '') into sender_name
  from public.profiles where id = new.from_user_id;

  -- Notify the recipient
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.to_user_id,
    'interest_received',
    'New Interest Received!',
    sender_name || ' has sent you an interest request.',
    jsonb_build_object('from_user_id', new.from_user_id)
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_interest_received on public.interests;
create trigger on_interest_received
  after insert on public.interests
  for each row execute function public.handle_new_interest_notification();

-- =========================================================
-- TRIGGER: Create notification when Interest is Accepted
-- =========================================================
create or replace function public.handle_interest_accepted_notification()
returns trigger as $$
declare
  accepter_name text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select first_name || ' ' || coalesce(last_name, '') into accepter_name
    from public.profiles where id = new.to_user_id;

    -- Notify original sender that their interest was accepted
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.from_user_id,
      'interest_accepted',
      'Interest Accepted! ❤️',
      accepter_name || ' accepted your interest! You can now chat.',
      jsonb_build_object('from_user_id', new.to_user_id)
    );

    -- Also create a "mutual match" notification for the accepter
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.to_user_id,
      'mutual_match',
      'It''s a Mutual Match! 🎉',
      'You matched with ' || (
        select first_name || ' ' || coalesce(last_name, '') from public.profiles where id = new.from_user_id
      ) || '!',
      jsonb_build_object('from_user_id', new.from_user_id)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_interest_accepted_notify on public.interests;
create trigger on_interest_accepted_notify
  after update on public.interests
  for each row execute function public.handle_interest_accepted_notification();
