const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.pdfvqxfvjwpcjogkfkgc:Hiren%40123!%40%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function setupUsers() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Enable pgcrypto for password hashing
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Create test user with hashed password and confirmed email
  const sql = `
  DO $$
  DECLARE
    test_uid uuid := '11111111-1111-1111-1111-111111111111';
    test_uid2 uuid := '22222222-2222-2222-2222-222222222222';
    encrypted_pw text := crypt('Password123!', gen_salt('bf'));
  BEGIN
    -- Insert or update user 1 (Rahul)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      test_uid,
      '00000000-0000-0000-0000-000000000000',
      'rahul.sharma@example.com',
      encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Rahul","last_name":"Sharma"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      ''
    ) ON CONFLICT (id) DO UPDATE SET
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = now();

    -- Insert or update user 2 (Priya)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      test_uid2,
      '00000000-0000-0000-0000-000000000000',
      'priya.patel@example.com',
      encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Priya","last_name":"Patel"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      ''
    ) ON CONFLICT (id) DO UPDATE SET
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = now();

    -- Insert profile for Rahul
    INSERT INTO public.profiles (
      id, first_name, last_name, gender, dob, religion, caste, mother_tongue, city, 
      education, profession, income, about_me, avatar_url,
      diet, smoking, drinking, family_type, father_occupation, mother_occupation, siblings,
      pref_min_age, pref_max_age, pref_religion, pref_location
    ) VALUES (
      test_uid, 'Rahul', 'Sharma', 'male', '1994-05-12', 'Hindu', 'Brahmin', 'Hindi', 'Mumbai', 
      'B.Tech', 'Software Engineer', '15-20 Lakhs', 'I am a simple guy who loves coding and traveling.', 
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'veg', 'no', 'no', 'nuclear', 
      'Retired', 'Homemaker', 1, 24, 30, 'Hindu', 'Mumbai'
    ) ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;

    -- Insert profile for Priya
    INSERT INTO public.profiles (
      id, first_name, last_name, gender, dob, religion, caste, mother_tongue, city, 
      education, profession, income, about_me, avatar_url,
      diet, smoking, drinking, family_type, father_occupation, mother_occupation, siblings,
      pref_min_age, pref_max_age, pref_religion, pref_location
    ) VALUES (
      test_uid2, 'Priya', 'Patel', 'female', '1996-08-22', 'Hindu', 'Patel', 'Gujarati', 'Ahmedabad', 
      'MBA', 'Marketing Manager', '10-15 Lakhs', 'An easy-going person with a positive attitude.', 
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'veg', 'no', 'occasionally', 'joint', 
      'Business', 'Homemaker', 1, 27, 32, 'Hindu', 'Gujarat'
    ) ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;

    -- Ensure memberships
    INSERT INTO public.memberships (user_id, plan, is_active)
    VALUES 
      (test_uid, 'platinum', true),
      (test_uid2, 'gold', true)
    ON CONFLICT (user_id) DO NOTHING;

  END $$;
  `;

  await client.query(sql);
  console.log('✅ Seeded test users successfully into auth.users and profiles!');
  await client.end();
}

setupUsers().catch(console.error);
