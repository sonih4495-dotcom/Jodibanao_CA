const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.pdfvqxfvjwpcjogkfkgc:Hiren%40123!%40%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function fixPermissions() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const grantSql = `
    -- Grant usage on public schema to standard Supabase roles
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

    -- Grant auth schema permissions needed by GoTrue / supabase_auth_admin
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, postgres, supabase_auth_admin;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, supabase_auth_admin, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, supabase_auth_admin, service_role;
  `;

  await client.query(grantSql);
  console.log('✅ Permissions granted successfully!');
  await client.end();
}

fixPermissions().catch(console.error);
