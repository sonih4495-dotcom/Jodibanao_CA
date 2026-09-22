-- Phase: Storage & Profile Photo Setup
-- Run this in your Supabase SQL Editor

-- Create a public "avatars" storage bucket (if not already exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 
  'avatars', 
  true,  -- Public so photos can be shown without auth
  5242880, -- 5 MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- RLS policy: Users can upload to their own folder
create policy "Users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: Users can update/delete their own avatar
create policy "Users can update own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: All authenticated users can view avatars (they're public, but just in case)
create policy "Anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Also create a "chat-media" bucket for Phase 1 chat attachments  
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media', 
  'chat-media', 
  false, -- Private since chats are private
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/ogg']
)
on conflict (id) do nothing;

create policy "Users can upload chat media" on storage.objects
  for insert with check (
    bucket_id = 'chat-media' and auth.uid() is not null
  );

create policy "Users can view chat media they have access to" on storage.objects
  for select using (
    bucket_id = 'chat-media' and auth.uid() is not null
  );
