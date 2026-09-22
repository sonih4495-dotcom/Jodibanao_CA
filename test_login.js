const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('Testing sign in with rahul.sharma@example.com ...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'rahul.sharma@example.com',
    password: 'Password123!',
  });

  if (error) {
    console.error('❌ Login error:', error.message);
  } else {
    console.log('✅ Login SUCCESS! User ID:', data.user.id);
    console.log('   Email:', data.user.email);
  }
}

testLogin();
