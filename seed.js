const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase instance using service role key to bypass RLS for seeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyProfiles = [
  {
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
    about: "I am a simple guy who loves coding and traveling. Looking for a partner who is understanding and supportive.",
    age: 29,
    height: "5'10\"",
    marital_status: "Never Married",
    blood_group: "O+",
    diet: "Vegetarian",
    smoking: "No",
    drinking: "No",
    family_type: "Nuclear",
    father_occupation: "Retired",
    mother_occupation: "Homemaker",
    siblings: "1 Sister",
    pref_min_age: 24,
    pref_max_age: 30,
    pref_religion: "Hindu",
    pref_location: "Mumbai",
    avatar_url: "https://i.pravatar.cc/150?img=11",
  },
  {
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
    about: "An easy-going person with a positive attitude. I enjoy reading and baking in my free time.",
    age: 27,
    height: "5'5\"",
    marital_status: "Never Married",
    blood_group: "B+",
    diet: "Vegetarian",
    smoking: "No",
    drinking: "Occasionally",
    family_type: "Joint",
    father_occupation: "Business",
    mother_occupation: "Homemaker",
    siblings: "1 Brother",
    pref_min_age: 27,
    pref_max_age: 32,
    pref_religion: "Hindu",
    pref_location: "Gujarat",
    avatar_url: "https://i.pravatar.cc/150?img=5",
  },
  {
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
    about: "Ambitious and family-oriented. Love trying out new restaurants and weekend getaways.",
    age: 32,
    height: "6'0\"",
    marital_status: "Never Married",
    blood_group: "A+",
    diet: "Non-Vegetarian",
    smoking: "No",
    drinking: "Yes",
    family_type: "Nuclear",
    father_occupation: "Business",
    mother_occupation: "Teacher",
    siblings: "None",
    pref_min_age: 26,
    pref_max_age: 31,
    pref_religion: "Sikh",
    pref_location: "Delhi NCR",
    avatar_url: "https://i.pravatar.cc/150?img=12",
  },
  {
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
    about: "Independent, tech-savvy, and love reading. Looking for someone with a modern outlook and respect for personal space.",
    age: 26,
    height: "5'4\"",
    marital_status: "Never Married",
    blood_group: "AB+",
    diet: "Eggetarian",
    smoking: "No",
    drinking: "No",
    family_type: "Nuclear",
    father_occupation: "Govt Employee",
    mother_occupation: "Homemaker",
    siblings: "1 Sister",
    pref_min_age: 27,
    pref_max_age: 32,
    pref_religion: "Hindu",
    pref_location: "Bangalore",
    avatar_url: "https://i.pravatar.cc/150?img=9",
  },
  {
    first_name: "Rishi",
    last_name: "Kapur",
    gender: "male",
    dob: "1993-02-18",
    religion: " हिंदू",
    caste: "Arora",
    mother_tongue: "Punjabi",
    city: "Mumbai",
    education: "B.Com",
    profession: "Entrepreneur",
    income: "30+ Lakhs",
    about: "Running my own startup. I have a busy life but I always make time for family and friends.",
    age: 31,
    height: "5'11\"",
    marital_status: "Never Married",
    blood_group: "B+",
    diet: "Non-Vegetarian",
    smoking: "No",
    drinking: "Occasionally",
    family_type: "Joint",
    father_occupation: "Business",
    mother_occupation: "Homemaker",
    siblings: "1 Brother",
    pref_min_age: 26,
    pref_max_age: 30,
    pref_religion: "Hindu",
    pref_location: "Mumbai",
    avatar_url: "https://i.pravatar.cc/150?img=14",
  }
];

async function seed() {
  console.log("Starting DB Seeding...");
  
  const createdProfiles = [];

  for (const profileData of dummyProfiles) {
    // 1. Create Supabase Auth User
    const email = `${profileData.first_name.toLowerCase()}.${profileData.last_name.toLowerCase()}@example.com`;
    const password = "Password123!";
    
    // Check if user exists first to prevent errors on multiple runs
    const { data: searchUsers } = await supabase.auth.admin.listUsers();
    let user = searchUsers?.users?.find(u => u.email === email);

    if (!user) {
      console.log(`Creating auth user for ${email}...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Failed to create auth user ${email}:`, authError);
        continue;
      }
      user = authData.user;
    } else {
        console.log(`Auth user ${email} already exists. Proceeding to update profile...`);
    }

    // 2. Insert/Upsert into Profiles Table
    const { id: _, ...restOfProfile } = profileData; // ensure we dont override ID if it was included
    
    const profilePayload = {
        id: user.id, // ID must match auth user
        ...restOfProfile
    };

    console.log(`Upserting profile for ${profileData.first_name}...`);
    const { data: pd, error: dbError } = await supabase
      .from('profiles')
      .upsert(profilePayload)
      .select()
      .single();

    if (dbError) {
      console.error(`Failed to upsert profile for ${profileData.first_name}:`, dbError);
    } else {
      console.log(`Successfully created/updated profile for ${profileData.first_name}`);
      createdProfiles.push(pd);
    }
  }
  
  // 3. Create some dummy interactions if we have enough profiles
  if (createdProfiles.length >= 4) {
      const p1 = createdProfiles[0]; // Rahul
      const p2 = createdProfiles[1]; // Priya
      const p3 = createdProfiles[2]; // Amit
      const p4 = createdProfiles[3]; // Anjali
      
      console.log("Creating dummy interests and conversations...");
      
      // Rahul -> Priya (Pending)
      await supabase.from('interests').upsert({ sender_id: p1.id, receiver_id: p2.id, status: 'pending' });
      
      // Amit -> Anjali (Accepted -> creates conversation)
      await supabase.from('interests').upsert({ sender_id: p3.id, receiver_id: p4.id, status: 'accepted' });
      
      // Priya -> Anjali (Shortlisted)
      await supabase.from('shortlists').upsert({ user_id: p2.id, profile_id: p4.id });

      // Check if conversation was created (trigger should do this, but just in case we fetch it)
      const { data: conv } = await supabase.from('conversations')
        .select('*')
        .or(`user1_id.eq.${p3.id},user2_id.eq.${p4.id}`)
        .or(`user1_id.eq.${p4.id},user2_id.eq.${p3.id}`)
        .limit(1)
        .maybeSingle();
        
      if (conv) {
          console.log("Adding dummy messages to conversation between Amit & Anjali...");
          await supabase.from('messages').insert([
              { conversation_id: conv.id, sender_id: p3.id, text: "Hi Anjali, I saw we matched! I really liked your profile." },
              { conversation_id: conv.id, sender_id: p4.id, text: "Hi Amit, thanks! It's great to connect. Are you from Delhi originally?" }
          ]);
      }
  }

  console.log("Seeding complete! You can log in with any of these accounts:");
  dummyProfiles.forEach(p => {
      console.log(`Email: ${p.first_name.toLowerCase()}.${p.last_name.toLowerCase()}@example.com / Password: Password123!`);
  });
}

seed().catch(console.error);
