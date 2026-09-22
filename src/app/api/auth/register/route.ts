import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      dob,
      professionType,
      membershipNumber,
      religion,
      caste,
      motherTongue,
      city,
      education,
      profession,
      income,
      about,
      diet,
      smoking,
      drinking,
      familyType,
      fatherOccupation,
      motherOccupation,
      siblings,
      prefMinAge,
      prefMaxAge,
      prefReligion,
      prefLocation,
      profileFor,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Create user with email_confirm: true (bypasses email confirmation requirement)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Upsert full profile data
    const profilePayload: Record<string, any> = {
      id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      gender: gender || null,
      dob: dob || null,
      profession_type: professionType || null,
      membership_number: membershipNumber || null,
      religion: religion || null,
      caste: caste || null,
      mother_tongue: motherTongue || null,
      city: city || null,
      education: education || null,
      profession: profession || professionType || null,
      income: income || null,
      about_me: about || null,
      diet: diet || null,
      smoking: smoking || null,
      drinking: drinking || null,
      family_type: familyType || null,
      father_occupation: fatherOccupation || null,
      mother_occupation: motherOccupation || null,
      siblings: siblings ? parseInt(siblings) : 0,
      pref_min_age: prefMinAge ? parseInt(prefMinAge) : 18,
      pref_max_age: prefMaxAge ? parseInt(prefMaxAge) : 99,
      pref_religion: prefReligion || null,
      pref_location: prefLocation || null,
      profile_for: profileFor || 'self',
      photo_visibility: "everyone",
      is_verified: false,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload);

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // 3. Ensure free membership exists
    await supabaseAdmin
      .from("memberships")
      .upsert({ user_id: userId, plan: "free", is_active: true });

    return NextResponse.json({
      success: true,
      message: "Account created and confirmed successfully.",
      userId,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during registration." },
      { status: 500 }
    );
  }
}
