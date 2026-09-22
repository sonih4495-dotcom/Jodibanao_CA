const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.pdfvqxfvjwpcjogkfkgc',
  password: 'Hiren@123!@#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase DB via Postgres');

  // Check columns in messages table
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    ORDER BY ordinal_position;
  `);
  console.log('CURRENT MESSAGES COLUMNS:', cols.rows.map(r => r.column_name));

  // Alter table messages to make sure all needed columns exist
  await client.query(`
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename text;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_mime_type text;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size_bytes bigint;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_duration_seconds integer;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id);
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  `);
  console.log('MESSAGES COLUMNS ADDED SUCCESSFULLY');

  // Enable Realtime replication for messages and conversations
  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE messages;`);
    console.log('Added messages to supabase_realtime publication');
  } catch (e) {
    console.log('Note on realtime messages publication:', e.message);
  }

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE conversations;`);
    console.log('Added conversations to supabase_realtime publication');
  } catch (e) {
    console.log('Note on realtime conversations publication:', e.message);
  }

  // Ensure RLS allows insert and select for authenticated users in messages
  await client.query(`
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON messages;
    CREATE POLICY "Allow all for authenticated users" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow all for authenticated users" ON conversations;
    CREATE POLICY "Allow all for authenticated users" ON conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);
  `);
  console.log('RLS POLICIES UPDATED FOR MESSAGES & CONVERSATIONS');

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
