import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Agora token generation using RtcTokenBuilder
// Note: Install agora-access-token: npm install agora-access-token
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelName, uid } = await req.json();
    if (!channelName) {
      return NextResponse.json({ error: "channelName required" }, { status: 400 });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      // Return app ID without token if certificate not configured
      // (works for testing without token verification)
      return NextResponse.json({ 
        token: null,
        appId: appId || "",
        channelName,
        uid: uid || 0,
        note: "Token generation requires AGORA_APP_CERTIFICATE env var"
      });
    }

    // Dynamic import to handle cases where package may not be installed
    try {
      const { RtcTokenBuilder, RtcRole } = await import("agora-access-token");
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid || 0,
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );

      return NextResponse.json({ token, appId, channelName, uid: uid || 0 });
    } catch (importError) {
      // agora-access-token not installed yet
      return NextResponse.json({
        token: null,
        appId: appId || "",
        channelName,
        uid: uid || 0,
        note: "Install agora-access-token package to enable token generation"
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
