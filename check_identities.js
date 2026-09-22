const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.pdfvqxfvjwpcjogkfkgc:Hiren%40123!%40%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkAuthIdentities() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const idRes = await client.query(`SELECT * FROM auth.identities;`);
  console.log('auth.identities:', idRes.rows);

  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities';
  `);
  console.log('identities columns:', cols.rows);

  await client.end();
}

checkAuthIdentities().catch(console.error);
