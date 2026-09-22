const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const profiles = [
  {
    email: "rahul.sharma@example.com",
    password: "Password123!",
    first_name: "Rahul",
    last_name: "Sharma",
    gender: "male",
    dob: "1994-05-12",
    religion: "Hindu",
    caste: "Brahmin",
    mother_tongue: "Hindi",
    city: "Mumbai",
    education: "B.Tech",
    profession: "Software Engineer",
    income: "15-20 Lakhs",
    about_me: "I am a simple guy who loves coding, travel, and spending time with family.",
    diet: "veg",
    smoking: "no",
    drinking: "no",
    family_type: "nuclear",
    father_occupation: "Retired",
    mother_occupation: "Homemaker",
    siblings: 1,
    pref_min_age: 24,
    pref_max_age: 30,
    pref_religion: "Hindu",
    pref_location: "Mumbai",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    plan: "platinum"
  },
  {
    email: "priya.patel@example.com",
    password: "Password123!",
    first_name: "Priya",
    last_name: "Patel",
    gender: "female",
    dob: "1996-08-22",
    religion: "Hindu",
    caste: "Patel",
    mother_tongue: "Gujarati",
    city: "Ahmedabad",
    education: "MBA",
    profession: "Marketing Manager",
    income: "10-15 Lakhs",
    about_me: "An easy-going person with a positive attitude. I enjoy reading and baking in my free time.",
    diet: "veg",
    smoking: "no",
    drinking: "occasionally",
    family_type: "joint",
    father_occupation: "Business",
    mother_occupation: "Homemaker",
    siblings: 1,
    pref_min_age: 27,
    pref_max_age: 32,
    pref_religion: "Hindu",
    pref_location: "Gujarat",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    plan: "gold"
  },
  {
    email: "amit.singh@example.com",
    password: "Password123!",
    first_name: "Amit",
    last_name: "Singh",
    gender: "male",
    dob: "1992-03-15",
    religion: "Sikh",
    caste: "Khatri",
    mother_tongue: "Punjabi",
    city: "Delhi",
    education: "CA",
    profession: "Chartered Accountant",
    income: "20-30 Lakhs",
    about_me: "Ambitious and family-oriented. Love trying out new restaurants and weekend getaways.",
    diet: "non-veg",
    smoking: "no",
    drinking: "yes",
    family_type: "nuclear",
    father_occupation: "Business",
    mother_occupation: "Teacher",
    siblings: 0,
    pref_min_age: 26,
    pref_max_age: 31,
    pref_religion: "Sikh",
    pref_location: "Delhi NCR",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    plan: "silver"
  },
  {
    email: "anjali.verma@example.com",
    password: "Password123!",
    first_name: "Anjali",
    last_name: "Verma",
    gender: "female",
    dob: "1997-11-05",
    religion: "Hindu",
    caste: "Kayastha",
    mother_tongue: "Hindi",
    city: "Bangalore",
    education: "M.Sc",
    profession: "Data Scientist",
    income: "20-30 Lakhs",
    about_me: "Independent, tech-savvy, and love reading. Looking for someone with a modern outlook.",
    diet: "veg",
    smoking: "no",
    drinking: "no",
    family_type: "nuclear",
    father_occupation: "Govt Employee",
    mother_occupation: "Homemaker",
    siblings: 1,
    pref_min_age: 27,
    pref_max_age: 32,
    pref_religion: "Hindu",
    pref_location: "Bangalore",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    plan: "gold"
  }
];

async function seedAll() {
  console.log("Seeding all users properly via Admin API...");
  
  // List existing auth users
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUsers = userList?.users || [];

  for (const p of profiles) {
    let user = existingUsers.find(u => u.email === p.email);

    if (!user) {
      console.log(`Creating user: ${p.email}`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: p.email,
        password: p.password,
        email_confirm: true,
        user_metadata: { first_name: p.first_name, last_name: p.last_name }
      });
      if (error) {
        console.error(`Error creating ${p.email}:`, error.message);
        continue;
      }
      user = data.user;
    } else {
      console.log(`User ${p.email} exists, updating password...`);
      await supabase.auth.admin.updateUserById(user.id, {
        password: p.password,
        email_confirm: true
      });
    }

    const { plan, email, password, ...profileData } = p;
    const { error: profError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileData });

    if (profError) {
      console.error(`Error saving profile for ${p.first_name}:`, profError.message);
    } else {
      console.log(`✅ Profile updated: ${p.first_name} ${p.last_name}`);
    }

    await supabase
      .from('memberships')
      .upsert({ user_id: user.id, plan: plan || 'free', is_active: true });
  }

  console.log("\n🎉 All users and profiles ready!");
}

seedAll().catch(console.error);
