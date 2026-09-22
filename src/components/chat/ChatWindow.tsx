"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Smile, Paperclip, Mic, MoreVertical, 
  Phone, Video, Check, CheckCheck, ImageIcon, Loader2
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

export function ChatWindow({ 
  conversation, 
  messages, 
  currentUserId, 
  onSendMessage 
}: any) {
  const supabase = createClient();
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const otherUser = conversation?.user1_id === currentUserId 
    ? conversation?.user2 
    : conversation?.user1;

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, "text");
    setNewMessage("");
    setShowEmoji(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId || !conversation) return;
    setUploadingImage(true);

    const ext = file.name.split(".").pop();
    const path = `${conversation.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file);

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
      onSendMessage(publicUrl, "image");
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-muted/20">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Send className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-serif font-medium text-foreground">Your Messages</h2>
        <p className="text-muted-foreground mt-2">Select a conversation from the sidebar to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full relative">
      {/* Chat Header */}
      <div className="h-16 px-4 py-3 border-b border-border flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherUser?.first_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">
              {otherUser?.first_name} {otherUser?.last_name}
            </h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 relative"
      >
        {messages.map((msg: any, idx: number) => {
          const isMine = msg.sender_id === currentUserId;
          const showAvatar = !isMine && (idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id);
          
          return (
            <div 
              key={msg.id} 
              className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <div className="w-8 flex-shrink-0 flex items-end">
                  {showAvatar && (
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src={otherUser?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {otherUser?.first_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              
              <div className={`group relative flex flex-col max-w-[70%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMine 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.type === 'image' ? (
                    <img 
                      src={msg.content} 
                      alt="Sent image" 
                      className="max-w-[220px] rounded-lg cursor-pointer hover:opacity-95"
                      onClick={() => window.open(msg.content, '_blank')}
                    />
                  ) : (
                    <p className="break-words">{msg.content}</p>
                  )}
                  
                  <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-[10px]`}>
                    <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                    {isMine && (
                      msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-300" /> :
                      msg.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> :
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emoji Picker Overlay */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-lg overflow-hidden border border-border">
          <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} theme={"auto" as any} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-muted/50 rounded-xl p-1 pr-2 border border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`shrink-0 rounded-full hover:bg-background ${showEmoji ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 rounded-full hover:bg-background text-muted-foreground"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>
          <input 
            ref={imageInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload} 
          />
          
          <TextareaAutosize 
            value={newMessage}
            onChange={(e: any) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none max-h-32 min-h-[40px] py-2.5 text-sm"
          />

          {newMessage.trim() ? (
            <Button 
              size="icon" 
              className="shrink-0 rounded-full bg-primary text-primary-foreground h-10 w-10 self-end mb-0.5"
              onClick={handleSend}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-background text-muted-foreground h-10 w-10 self-end mb-0.5">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// A simple auto-resizing textarea to simulate WhatsApp
function TextareaAutosize({ value, onChange, onKeyDown, placeholder, className }: any) {
  const ref = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`focus:outline-none ${className}`}
      rows={1}
    />
  );
}
