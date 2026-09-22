"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";

export function ChatSidebar({ conversations, activeChatId, onSelectChat, currentUserId }: any) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c: any) => {
    const otherUser = c.user1_id === currentUserId ? c.user2 : c.user1;
    const name = `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="w-full md:w-80 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border space-y-4">
        <h2 className="text-xl font-serif font-bold">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            className="pl-9 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm mt-4">
            No conversations found.
          </div>
        ) : (
          filtered.map((chat: any) => {
            const otherUser = chat.user1_id === currentUserId ? chat.user2 : chat.user1;
            const isActive = chat.id === activeChatId;
            const name = `${otherUser?.first_name || "Unknown"} ${otherUser?.last_name || ""}`;
            
            // Derive last message preview
            const lastMsg = chat.messages?.[0]; // Assuming ordered desc
            const preview = lastMsg?.content || (lastMsg?.media_url ? "Sent an attachment" : "Start chatting");
            const time = lastMsg?.created_at ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true }) : "";
            
            // Unread count (placeholder logic)
            const unreadCount = 0; 

            return (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40 ${isActive ? 'bg-muted/50' : ''}`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarImage src={otherUser?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-medium text-sm truncate pr-2">{name}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {preview}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
