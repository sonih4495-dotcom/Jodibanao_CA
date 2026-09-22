require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInterest() {
  // We need a real session to test RLS. We can't log in easily if accounts have no passwords.
  // Wait, let's use the SERVICE_ROLE_KEY to check what's actually in the interests table!
  // Wait, the user doesn't have a SERVICE_ROLE_KEY in .env.local.
  
  // Let's do an anonymous insert if possible? No, RLS prevents it.
  
  // Let's just create a new user via API, login, and send an interest
  console.log("Creating a temporary user via api...");
  const email = `test.user.${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: { data: { first_name: 'Test', last_name: 'User' } }
  });
  
  if (authError) {
    console.error("Failed to sign up:", authError.message);
    return;
  }
  
  console.log("Logged in as:", authData.user.id);
  
  // Find a target user to send interest to
  const { data: targetUser } = await supabase.from('profiles').select('*').limit(1).single();
  
  if (targetUser) {
     console.log("Sending interest to:", targetUser.id);
     const { data: insertData, error: insertError } = await supabase
       .from('interests')
       .insert({
         from_user_id: authData.user.id,
         to_user_id: targetUser.id,
         status: 'pending'
       })
       .select();
       
     if (insertError) {
       console.error("Failed to send interest:", insertError.message);
     } else {
       console.log("Successfully sent interest!", insertData);
       
       // Try fetching it back
       const { data: fetched } = await supabase.from('interests').select('*').eq('from_user_id', authData.user.id);
       console.log("Fetched interests:", fetched);
     }
  } else {
     console.log("No target profiles found.");
  }
}

testInterest();
