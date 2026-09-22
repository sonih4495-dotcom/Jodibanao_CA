/**
 * push_schema.js
 * Pushes all SQL schema files to the new Supabase PostgreSQL database.
 * Run with: node push_schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = 'postgresql://postgres.pdfvqxfvjwpcjogkfkgc:Hiren%40123!%40%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

// SQL files to run in order (dependency order matters)
const SQL_FILES = [
  'supabase_schema.sql',          // Base tables: profiles, matches, messages + trigger
  'phase1_chat_schema.sql',       // Upgrade matches→conversations, WhatsApp-style chat
  'phase2_interests_schema.sql',  // Interests, shortlists, triggers
  'phase3_memberships_schema.sql',// Memberships, payments, updated handle_new_user
  'phase4_notifications_schema.sql', // Notifications + triggers
  'phase6_7_boost_safety_schema.sql', // Boosts, reports, blocks, profile_views
  'fix_interest_triggers.sql',    // Bug fix: NULL-safe notification triggers
  'success_stories_schema.sql',   // Success stories table
  'storage_setup.sql',            // Storage buckets & policies
];

async function pushSchema() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  console.log('🔌 Connecting to Supabase database...');
  await client.connect();
  console.log('✅ Connected!\n');

  for (const file of SQL_FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping missing file: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Running: ${file}`);
    try {
      await client.query(sql);
      console.log(`✅ Done: ${file}\n`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`);
      console.error(`   ${err.message}\n`);
      // Continue with remaining files even if one fails (some may already exist)
    }
  }

  await client.end();
  console.log('🎉 Schema push complete!');
}

pushSchema().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
