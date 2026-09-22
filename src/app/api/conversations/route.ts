import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// POST: get or create conversation with partnerId
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId, currentUserId } = body;

    let userId: string | null = null;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // ignore
    }

    if (!userId && currentUserId) {
      userId = currentUserId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    // Check if conversation already exists
    const { data: existingConvs } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .or(`and(user1_id.eq.${userId},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${userId})`);

    if (existingConvs && existingConvs.length > 0) {
      return NextResponse.json({ conversation: existingConvs[0] });
    }

    // Create new conversation
    const { data: newConv, error: insertError } = await supabaseAdmin
      .from("conversations")
      .insert({
        user1_id: userId,
        user2_id: partnerId,
        status: "active",
        last_message_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ conversation: newConv });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
