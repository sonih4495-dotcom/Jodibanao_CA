import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

const PLAN_PRICES: Record<string, { amount: number; months: number; name: string }> = {
  silver: { amount: 249900, months: 3, name: "Silver" },   // ₹2499 in paise
  gold: { amount: 499900, months: 6, name: "Gold" },        // ₹4999 in paise
  platinum: { amount: 349900, months: 12, name: "Platinum" }, // ₹3499 in paise
};

// POST: Create a Razorpay order
export async function POST(req: NextRequest) {
  try {
    // Validate session server-side
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use userId from session — never trust client body for this
    const userId = user.id;
    const { plan } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planInfo = PLAN_PRICES[plan];

    const order = await razorpay.orders.create({
      amount: planInfo.amount,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { plan, userId },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: planInfo.amount,
      currency: "INR",
      plan: planInfo.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

