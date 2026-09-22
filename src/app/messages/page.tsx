"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { VoiceCallModal } from "@/components/chat/VoiceCallModal";
import { VideoCallModal } from "@/components/chat/VideoCallModal";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutualMatch, setIsMutualMatch] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  
  const [activeCallType, setActiveCallType] = useState<"voice" | "video" | null>(null);

  // Helper to load and populate conversations with profile details
  const fetchConversationsList = useCallback(async (currentUserId: string) => {
    // Fetch all conversations for the user
    const { data: rawConvs, error: convError } = await supabase
      .from("conversations")
      .select(`
        *,
        messages(id, content, created_at, status, media_url, sender_id, message_type)
      `)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false });

    if (convError || !rawConvs) {
      return [];
    }

    // Collect all user IDs involved
    const userIds = Array.from(
      new Set(rawConvs.flatMap(c => [c.user1_id, c.user2_id]).filter(Boolean))
    );

    // Fetch profile details for all participants
    const { data: profilesList } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, city, profession_type, gender")
      .in("id", userIds);

    const profileMap = new Map((profilesList || []).map(p => [p.id, p]));

    // Attach user1, user2 and sort messages
    const enriched = rawConvs.map(c => {
      const msgs = (c.messages || []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        ...c,
        user1: profileMap.get(c.user1_id) || { id: c.user1_id, first_name: "Member" },
        user2: profileMap.get(c.user2_id) || { id: c.user2_id, first_name: "Member" },
        messages: msgs
      };
    });

    return enriched;
  }, [supabase]);

  // 1. Authenticate and Initialize Chat
  useEffect(() => {
    let isMounted = true;

    const initChat = async (currentUser: any) => {
      if (!currentUser || !isMounted) return;
      setUser(currentUser);

      let loadedConversations = await fetchConversationsList(currentUser.id);

      const paramChatId = searchParams.get("chatId");
      const paramWith = searchParams.get("with");

      if (paramChatId) {
        setActiveChatId(paramChatId);
      } else if (paramWith && paramWith !== currentUser.id) {
        // Find if conversation already exists with this partner
        let existing = loadedConversations.find(
          c => c.user1_id === paramWith || c.user2_id === paramWith
        );

        if (existing) {
          setActiveChatId(existing.id);
        } else {
          // Request conversation creation via API
          try {
            const res = await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ partnerId: paramWith, currentUserId: currentUser.id })
            });
            const result = await res.json();
            if (result.conversation) {
              // Reload conversations list
              loadedConversations = await fetchConversationsList(currentUser.id);
              setActiveChatId(result.conversation.id);
            }
          } catch (e) {
            console.error("Error creating conversation:", e);
          }
        }
      } else if (loadedConversations.length > 0 && !activeChatId) {
        // Optional default to first conversation on desktop
        if (typeof window !== "undefined" && window.innerWidth > 768) {
          setActiveChatId(loadedConversations[0].id);
        }
      }

      if (isMounted) {
        setConversations(loadedConversations);
        setIsLoading(false);
      }
    };

    // Check existing session or user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        initChat(session.user);
      } else {
        supabase.auth.getUser().then(({ data: { user: authUser } }) => {
          if (!isMounted) return;
          if (authUser) {
            initChat(authUser);
          } else {
            setIsLoading(false);
            router.push("/login");
          }
        });
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        initChat(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams, fetchConversationsList, supabase]);

  // 2. Fetch Active Chat Messages & Match Status
  useEffect(() => {
    if (!activeChatId || !user) return;

    let isMounted = true;

    const loadMessagesAndStatus = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChatId)
        .order("created_at", { ascending: true });
        
      if (isMounted && msgs) setMessages(msgs);

      const activeConversation = conversations.find(c => c.id === activeChatId);
      const partnerId = activeConversation 
        ? (activeConversation.user1_id === user.id ? activeConversation.user2_id : activeConversation.user1_id)
        : searchParams.get("with");

      if (partnerId) {
        // Fetch partner profile
        const { data: partner } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .maybeSingle();
        
        if (isMounted && partner) setPartnerProfile(partner);

        // Fetch interest statuses to check mutual match
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
        if (isMounted) setIsMutualMatch(isMutual);
      }
    };

    loadMessagesAndStatus();

    return () => {
      isMounted = false;
    };
  }, [activeChatId, user, conversations, searchParams, supabase]);

  // 3. Supabase Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-messages-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          
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

    // Add 3-second polling fallback to ensure messages are delivered even if WebSocket reconnects or times out
    const pollInterval = setInterval(async () => {
      if (!activeChatId) return;
      const { data: latestMsgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChatId)
        .order("created_at", { ascending: true });

      if (latestMsgs && latestMsgs.length > 0) {
        setMessages((prev) => {
          if (prev.length !== latestMsgs.length || (latestMsgs[latestMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            return latestMsgs;
          }
          return prev;
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user, activeChatId, supabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.id === activeChatId) || (activeChatId ? { id: activeChatId } : null);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-muted/20">
      
      <div className="flex-1 flex overflow-hidden container mx-auto max-w-7xl py-4 px-4">
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

export default function Messages() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
