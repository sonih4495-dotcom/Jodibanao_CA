const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.pdfvqxfvjwpcjogkfkgc:Hiren%40123!%40%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkDb() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Check auth.users table
  const res = await client.query(`SELECT id, email, confirmed_at, email_confirmed_at, role, aud FROM auth.users;`);
  console.log('auth.users:', res.rows);

  // Check triggers on auth.users
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name, action_statement, action_orientation, action_timing
    FROM information_schema.triggers
    WHERE event_object_table = 'users' OR event_object_schema = 'auth';
  `);
  console.log('Triggers on auth:', triggers.rows);

  // Check handle_new_user function definition
  const funcDef = await client.query(`
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'handle_new_user';
  `);
  console.log('handle_new_user def:', funcDef.rows[0]?.pg_get_functiondef);

  await client.end();
}

checkDb().catch(console.error);
