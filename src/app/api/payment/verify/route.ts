import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

// Use service role for admin-level DB writes
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_DURATIONS: Record<string, number> = {
  silver: 3,
  gold: 6,
  platinum: 12,
};

// POST: Verify Razorpay signature and activate membership
export async function POST(req: NextRequest) {
  try {
    // Validate session server-side — get userId from session, not body
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      amount,
    } = await req.json();

    // Use session user id — never trust client-provided userId
    const userId = user.id;

    // 1. Verify signature (security check)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Calculate membership expiry
    const months = PLAN_DURATIONS[plan] || 3;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // 3. Upsert the membership row for this user
    const { error: membershipError } = await supabaseAdmin
      .from("memberships")
      .upsert({
        user_id: userId,
        plan,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (membershipError) throw membershipError;

    // 4. Record the payment transaction
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        plan,
        status: "captured",
      });

    if (paymentError) throw paymentError;

    return NextResponse.json({ success: true, message: "Membership activated!" });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
