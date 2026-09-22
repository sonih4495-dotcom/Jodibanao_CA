require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('interests').select('*').limit(1);
  if (error) {
    console.error("Error querying interests table:", error);
  } else {
    console.log("Interests table exists. Rows:", data);
  }
}

check();
