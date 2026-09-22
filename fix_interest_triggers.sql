-- =========================================================
-- BUG FIX: Protect Notification Triggers from NULL concatenations
-- =========================================================
-- If a user sends or accepts an interest before filling out their profile, `first_name` is NULL.
-- In PostgreSQL, `NULL || 'string'` evaluates to `NULL`.
-- Since `notifications.body` has a NOT NULL constraint, this was causing the trigger to fail,
-- which in turn rolled back the entire `INSERT INTO interests` transaction silently.

create or replace function public.handle_new_interest_notification()
returns trigger as $$
declare
  sender_name text;
begin
  -- Safely COALESCE missing names to prevent NULL strings breaking the trigger
  select coalesce(first_name, 'A user') || ' ' || coalesce(last_name, '') into sender_name
  from public.profiles where id = new.from_user_id;

  -- Notify the recipient
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.to_user_id,
    'interest_received',
    'New Interest Received!',
    trim(sender_name) || ' has sent you an interest request.',
    jsonb_build_object('from_user_id', new.from_user_id)
  );

  return new;
end;
$$ language plpgsql security definer;


create or replace function public.handle_interest_accepted_notification()
returns trigger as $$
declare
  accepter_name text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    -- Safely COALESCE missing names to prevent NULL strings breaking the trigger
    select coalesce(first_name, 'A user') || ' ' || coalesce(last_name, '') into accepter_name
    from public.profiles where id = new.to_user_id;

    -- Notify original sender that their interest was accepted
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.from_user_id,
      'interest_accepted',
      'Interest Accepted! ❤️',
      trim(accepter_name) || ' accepted your interest! You can now chat.',
      jsonb_build_object('from_user_id', new.to_user_id)
    );

    -- Also create a "mutual match" notification for the accepter
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.to_user_id,
      'mutual_match',
      'It''s a Mutual Match! 🎉',
      'You matched with ' || coalesce((
        select trim(coalesce(first_name, 'a user') || ' ' || coalesce(last_name, '')) 
        from public.profiles where id = new.from_user_id
      ), 'a user') || '!',
      jsonb_build_object('from_user_id', new.from_user_id)
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;
