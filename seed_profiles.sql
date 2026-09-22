-- Supabase SQL DB Seeding Script
-- Instructions: Copy and paste this entire script into your Supabase SQL Editor and hit "Run"

-- Create 5 predefined UUIDs so we can link auth.users to public.profiles safely
DO $$
DECLARE
  uid1 uuid := '11111111-1111-1111-1111-111111111111';
  uid2 uuid := '22222222-2222-2222-2222-222222222222';
  uid3 uuid := '33333333-3333-3333-3333-333333333333';
  uid4 uuid := '44444444-4444-4444-4444-444444444444';
  uid5 uuid := '55555555-5555-5555-5555-555555555555';
BEGIN

  -- 1. Insert into auth.users (Needed for Foreign Keys)
  -- Note: We only insert the absolute minimum for auth.users to satisfy the foreign key constraint
  -- Passwords are not set here as these act as dummy profiles.
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  (uid1, 'rahul.s@example.com', '{"first_name": "Rahul", "last_name": "Sharma"}'),
  (uid2, 'priya.p@example.com', '{"first_name": "Priya", "last_name": "Patel"}'),
  (uid3, 'amit.s@example.com', '{"first_name": "Amit", "last_name": "Singh"}'),
  (uid4, 'anjali.v@example.com', '{"first_name": "Anjali", "last_name": "Verma"}'),
  (uid5, 'rishi.k@example.com', '{"first_name": "Rishi", "last_name": "Kapur"}')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Update/Insert into public.profiles
  -- Real-world fields mapping to the matches array
  INSERT INTO public.profiles (
    id, first_name, last_name, gender, dob, religion, caste, mother_tongue, city, 
    education, profession, income, about_me, avatar_url,
    diet, smoking, drinking, family_type, father_occupation, mother_occupation, siblings,
    pref_min_age, pref_max_age, pref_religion, pref_location
  ) VALUES 
  (uid1, 'Rahul', 'Sharma', 'male', '1994-05-12', 'Hindu', 'Brahmin', 'Hindi', 'Mumbai', 'B.Tech', 'Software Engineer', '15-20 Lakhs', 'I am a simple guy who loves coding and traveling.', 'https://i.pravatar.cc/150?img=11', 'veg', 'no', 'no', 'nuclear', 'Retired', 'Homemaker', 1, 24, 30, 'Hindu', 'Mumbai'),
  
  (uid2, 'Priya', 'Patel', 'female', '1996-08-22', 'Hindu', 'Patel', 'Gujarati', 'Ahmedabad', 'MBA', 'Marketing Manager', '10-15 Lakhs', 'An easy-going person with a positive attitude.', 'https://i.pravatar.cc/150?img=5', 'veg', 'no', 'occasionally', 'joint', 'Business', 'Homemaker', 1, 27, 32, 'Hindu', 'Gujarat'),

  (uid3, 'Amit', 'Singh', 'male', '1992-03-15', 'Sikh', 'Khatri', 'Punjabi', 'Delhi', 'CA', 'Chartered Accountant', '20-30 Lakhs', 'Ambitious and family-oriented.', 'https://i.pravatar.cc/150?img=12', 'non-veg', 'no', 'yes', 'nuclear', 'Business', 'Teacher', 0, 26, 31, 'Sikh', 'Delhi NCR'),

  (uid4, 'Anjali', 'Verma', 'female', '1997-11-05', 'Hindu', 'Kayastha', 'Hindi', 'Bangalore', 'M.Sc', 'Data Scientist', '20-30 Lakhs', 'Independent, tech-savvy, and love reading.', 'https://i.pravatar.cc/150?img=9', 'veg', 'no', 'no', 'nuclear', 'Govt Employee', 'Homemaker', 1, 27, 32, 'Hindu', 'Bangalore'),

  (uid5, 'Rishi', 'Kapur', 'male', '1993-02-18', 'Hindu', 'Arora', 'Punjabi', 'Mumbai', 'B.Com', 'Entrepreneur', '30+ Lakhs', 'Running my own startup. Always make time for family.', 'https://i.pravatar.cc/150?img=14', 'non-veg', 'no', 'occasionally', 'joint', 'Business', 'Homemaker', 1, 26, 30, 'Hindu', 'Mumbai')
  
  ON CONFLICT (id) DO UPDATE SET 
    gender = EXCLUDED.gender,
    dob = EXCLUDED.dob,
    religion = EXCLUDED.religion,
    caste = EXCLUDED.caste,
    mother_tongue = EXCLUDED.mother_tongue,
    city = EXCLUDED.city,
    education = EXCLUDED.education,
    profession = EXCLUDED.profession,
    income = EXCLUDED.income,
    about_me = EXCLUDED.about_me,
    avatar_url = EXCLUDED.avatar_url,
    diet = EXCLUDED.diet,
    smoking = EXCLUDED.smoking,
    drinking = EXCLUDED.drinking,
    family_type = EXCLUDED.family_type,
    father_occupation = EXCLUDED.father_occupation,
    mother_occupation = EXCLUDED.mother_occupation,
    siblings = EXCLUDED.siblings,
    pref_min_age = EXCLUDED.pref_min_age,
    pref_max_age = EXCLUDED.pref_max_age,
    pref_religion = EXCLUDED.pref_religion,
    pref_location = EXCLUDED.pref_location;
    
END $$;
