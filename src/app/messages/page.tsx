"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { VoiceCallModal } from "@/components/chat/VoiceCallModal";
import { VideoCallModal } from "@/components/chat/VideoCallModal";

export default function Messages() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutualMatch, setIsMutualMatch] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  
  const [activeCallType, setActiveCallType] = useState<"voice" | "video" | null>(null);

  // 1. Authenticate and Load Conversations
  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUser(session.user);

      // Fetch conversations where I am user1 or user2
      const { data: myConversations } = await supabase
        .from("conversations")
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(id, first_name, last_name, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, first_name, last_name, avatar_url),
          messages(id, content, created_at, status, media_url, sender_id)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order("last_message_at", { ascending: false });

      if (myConversations) {
        // Sort individual messages inside conversations to get the latest easily
        myConversations.forEach(c => {
          c.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
        setConversations(myConversations);
      }
      
      setIsLoading(false);
    };

    initChat();
  }, [router]);

  // 2. Fetch Active Chat Messages & Match Status
  useEffect(() => {
    if (!activeChatId || !user) return;

    const loadMessagesAndStatus = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChatId)
        .order("created_at", { ascending: true });
        
      if (msgs) setMessages(msgs);

      const activeConversation = conversations.find(c => c.id === activeChatId);
      if (activeConversation) {
        const partnerId = activeConversation.user1_id === user.id 
          ? activeConversation.user2_id 
          : activeConversation.user1_id;
        
        // Fetch partner profile
        const { data: partner } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .maybeSingle();
        
        if (partner) setPartnerProfile(partner);

        // Fetch interest statuses
        const { data: myInterest } = await supabase
          .from("interests")
          .select("status")
          .eq("from_user_id", user.id)
          .eq("to_user_id", partnerId)
          .maybeSingle();

        const { data: theirInterest } = await supabase
          .from("interests")
          .select("status")
          .eq("from_user_id", partnerId)
          .eq("to_user_id", user.id)
          .maybeSingle();

        const isMutual = myInterest?.status === "accepted" && theirInterest?.status === "accepted";
        setIsMutualMatch(isMutual);
      }
    };

    loadMessagesAndStatus();
  }, [activeChatId, user, conversations]);

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!user) return;

    // Listen for new messages globally
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          
          // If the message belongs to the currently active window, append it
          if (newMsg.conversation_id === activeChatId) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          // Update sidebar previews
          setConversations((prev) => 
            prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                return {
                  ...c,
                  messages: [newMsg, ...(c.messages || [])],
                  last_message_at: newMsg.created_at
                };
              }
              return c;
            }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChatId]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.id === activeChatId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      
      <div className="flex-1 flex overflow-hidden container mx-auto max-w-7xl py-6 px-4">
        <div className="bg-card w-full h-full rounded-2xl shadow-xl flex overflow-hidden border border-border/40">
          
          <ChatSidebar 
            conversations={conversations} 
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            currentUserId={user?.id}
          />
          
          <ChatWindow 
            conversation={activeConversation}
            messages={messages}
            currentUserId={user?.id}
            isMutualMatch={isMutualMatch}
            partnerProfile={partnerProfile}
            onCallStart={(type) => setActiveCallType(type)}
          />

        </div>
      </div>
      
      {/* Call Modals */}
      {activeCallType === "voice" && partnerProfile && (
        <VoiceCallModal 
          currentUserId={user?.id}
          partnerId={partnerProfile.id}
          partnerName={`${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim() || "User"}
          partnerAvatar={partnerProfile.avatar_url}
          onClose={() => setActiveCallType(null)}
        />
      )}
      
      {activeCallType === "video" && partnerProfile && (
        <VideoCallModal 
          currentUserId={user?.id}
          partnerId={partnerProfile.id}
          partnerName={`${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim() || "User"}
          partnerAvatar={partnerProfile.avatar_url}
          onClose={() => setActiveCallType(null)}
        />
      )}
    </div>
  );
}
