const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.pdfvqxfvjwpcjogkfkgc',
  password: 'Hiren@123!@#',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  await client.connect();
  console.log('Connected to DB');

  const statements = [
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession_type text`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_number text`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_visibility text DEFAULT 'everyone'`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false`,
    `UPDATE public.profiles SET profession_type = 'CA', membership_number = 'TEST001' WHERE profession_type IS NULL`,
    `COMMENT ON COLUMN public.profiles.profession_type IS 'CA | CA Student | CS | CS Student'`,
    `COMMENT ON COLUMN public.profiles.membership_number IS 'ICAI or ICSI membership/student number'`,
    `COMMENT ON COLUMN public.profiles.photo_visibility IS 'everyone | mutual | verified_only'`,
    `COMMENT ON COLUMN public.profiles.is_verified IS 'Admin-approved verified professional badge'`,
  ];

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('OK:', stmt.substring(0, 70));
    } catch (err) {
      console.log('ERR:', stmt.substring(0, 70), '->', err.message);
    }
  }

  await client.end();
  console.log('\nMigration complete!');
}

runMigration().catch(console.error);
