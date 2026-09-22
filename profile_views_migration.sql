-- Profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_viewed_id ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_pv_viewer_id ON profile_views(viewer_id);

-- Block list
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Extended profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_for text DEFAULT 'self';

-- Message type enhancements
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_mime_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size_bytes bigint;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_duration_seconds integer;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Contact requests
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false
);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email text PRIMARY KEY,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Call logs (for voice/video calls)
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid,
  caller_id uuid REFERENCES profiles(id),
  callee_id uuid REFERENCES profiles(id),
  call_type text CHECK (call_type IN ('voice', 'video')),
  status text CHECK (status IN ('completed', 'missed', 'declined', 'busy')),
  duration_seconds integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
