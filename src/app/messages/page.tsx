"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Messages() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // 2. Fetch Active Chat Messages
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChatId)
        .order("created_at", { ascending: true });
        
      if (data) setMessages(data);
    };

    loadMessages();
  }, [activeChatId]);

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
            setMessages((prev) => [...prev, newMsg]);
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

  const handleSendMessage = async (content: string, type = "text") => {
    if (!activeChatId || !user) return;

    // Quick optimistic update to avoid input lag
    const tempMsg = {
      id: crypto.randomUUID(),
      conversation_id: activeChatId,
      sender_id: user.id,
      content,
      type,
      status: "sent",
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeChatId,
        sender_id: user.id,
        content,
        type,
        status: "sent"
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      // Replace optimistic message with actual DB message to get correct ID
      setMessages((prev) => prev.map(m => m.id === tempMsg.id ? data : m));
      
      // Update the conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeChatId);
    }
  };

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
            onSendMessage={handleSendMessage}
          />

        </div>
      </div>
    </div>
  );
}
