"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send, Mic, Image as ImageIcon, Video, FileText, Camera, Phone, PhoneCall,
  Video as VideoIcon, X, Download, Play, Lock, Smile, Reply, Trash2,
  MoreVertical, ArrowDown, Check, CheckCheck, Loader2, Paperclip, Flag, ShieldAlert
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { useRouter } from "next/navigation";

interface Props {
  conversation: any;
  currentUserId: string;
  messages: any[];
  isMutualMatch: boolean;
  partnerProfile: any;
  onCallStart?: (type: "voice" | "video") => void;
}

export function ChatWindow({ conversation, currentUserId, messages: initialMessages, isMutualMatch, partnerProfile, onCallStart }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const anyFileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conversationId = conversation?.id;
  const partnerName = partnerProfile ? `${partnerProfile.first_name || ""} ${partnerProfile.last_name || ""}`.trim() : "User";

  // Check block status
  useEffect(() => {
    if (!currentUserId || !partnerProfile?.id) return;
    const checkBlock = async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", partnerProfile.id)
        .maybeSingle();
      setIsBlocked(!!data);
    };
    checkBlock();
  }, [currentUserId, partnerProfile?.id]);

  const handleBlockUser = async () => {
    if (!currentUserId || !partnerProfile?.id) return;
    if (!confirm(`Are you sure you want to block ${partnerName}?`)) return;
    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: currentUserId,
        blocked_id: partnerProfile.id
      });
      if (error) throw error;
      toast.success("User blocked.");
      setIsBlocked(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to block user");
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime: subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates (optimistic UI already added it)
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== currentUserId) {
          setPartnerTyping(true);
          setTimeout(() => setPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const broadcastTyping = useCallback(() => {
    if (!conversationId) return;
    supabase.channel(`chat-${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }, [conversationId, currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
  };

  const sendMessage = async (content: string, messageType = "text", mediaUrl?: string, mediaFilename?: string, mediaMimeType?: string, mediaSize?: number, mediaDuration?: number, replyToId?: string) => {
    if (!conversationId || !currentUserId) return;
    const tempId = crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content || "",
      message_type: messageType,
      media_url: mediaUrl || null,
      media_filename: mediaFilename || null,
      media_mime_type: mediaMimeType || null,
      media_size_bytes: mediaSize || null,
      media_duration_seconds: mediaDuration || null,
      reply_to_id: replyToId || null,
      status: "sent",
      created_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyTo(null);

    const { data, error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content || "",
      message_type: messageType,
      media_url: mediaUrl || null,
      media_filename: mediaFilename || null,
      media_mime_type: mediaMimeType || null,
      media_size_bytes: mediaSize || null,
      media_duration_seconds: mediaDuration || null,
      reply_to_id: replyToId || null,
      status: "sent",
    }).select().single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send message.");
      return;
    }

    setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));

    // Update conversation last_message_at
    await supabase.from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  const handleSendText = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    setNewMessage("");
    await sendMessage(text, "text", undefined, undefined, undefined, undefined, undefined, replyTo?.id);
    setSending(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<{ url: string } | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${conversationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
    return { url: publicUrl };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadFile(file, "images");
    if (result) {
      await sendMessage("", "image", result.url, file.name, file.type, file.size);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("Video must be under 25MB."); return; }
    setUploading(true);
    const result = await uploadFile(file, "videos");
    if (result) {
      await sendMessage("", "video", result.url, file.name, file.type, file.size);
    }
    setUploading(false);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File must be under 50MB."); return; }
    setUploading(true);
    const result = await uploadFile(file, "files");
    if (result) {
      await sendMessage("", "file", result.url, file.name, file.type, file.size);
    }
    setUploading(false);
    if (anyFileInputRef.current) anyFileInputRef.current.value = "";
  };

  const handleVoiceSend = async (audioBlob: Blob, durationSeconds: number) => {
    const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
    setUploading(true);
    const result = await uploadFile(file, "voice");
    if (result) {
      await sendMessage("", "voice", result.url, file.name, "audio/webm", file.size, durationSeconds);
    }
    setUploading(false);
    setShowVoiceRecorder(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    await supabase.from("messages").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("id", msgId);
  };

  const formatTime = (dateStr: string) => format(new Date(dateStr), "h:mm a");

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "d MMM yyyy");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMessage = (msg: any, prevMsg: any) => {
    const isSelf = msg.sender_id === currentUserId;
    const showDate = !prevMsg || getDateLabel(msg.created_at) !== getDateLabel(prevMsg.created_at);

    if (msg.is_deleted) {
      return (
        <div key={msg.id}>
          {showDate && <div className="text-center my-3"><span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{getDateLabel(msg.created_at)}</span></div>}
          <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-1`}>
            <p className="text-xs text-muted-foreground italic px-3 py-1.5 bg-muted/50 rounded-2xl">{isSelf ? "You deleted this message" : "This message was deleted"}</p>
          </div>
        </div>
      );
    }

    const bubbleBase = `max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm group relative`;
    const selfBubble = `${bubbleBase} bg-primary text-white rounded-tr-sm`;
    const otherBubble = `${bubbleBase} bg-white border border-border text-foreground rounded-tl-sm`;

    return (
      <div key={msg.id}>
        {showDate && <div className="text-center my-3"><span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{getDateLabel(msg.created_at)}</span></div>}
        <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-1 group`}>
          {!isSelf && (
            <Avatar className="w-7 h-7 mr-2 mt-auto shrink-0">
              <AvatarImage src={partnerProfile?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{partnerName?.[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col">
            {replyTo?.id === msg.id && null /* just a marker */}
            {msg.reply_to_id && (
              <div className={`text-xs px-3 py-1.5 rounded-lg mb-1 border-l-2 ${isSelf ? "bg-white/20 border-white/50 text-white/80" : "bg-muted border-primary/40 text-muted-foreground"}`}>
                Replied to a message
              </div>
            )}
            <div className={isSelf ? selfBubble : otherBubble}>
              {/* Text */}
              {msg.message_type === "text" && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}

              {/* Image */}
              {msg.message_type === "image" && (
                <button onClick={() => setLightboxImg(msg.media_url)} className="block">
                  <img src={msg.media_url} alt="Image" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                </button>
              )}

              {/* Video */}
              {msg.message_type === "video" && (
                <video src={msg.media_url} controls className="max-w-[240px] rounded-lg" />
              )}

              {/* Voice */}
              {msg.message_type === "voice" && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Play className="w-4 h-4 shrink-0" />
                  <audio src={msg.media_url} controls className="h-8 max-w-[180px]" />
                  {msg.media_duration_seconds && (
                    <span className="text-xs opacity-70">{Math.floor(msg.media_duration_seconds / 60).toString().padStart(2,'0')}:{(msg.media_duration_seconds % 60).toString().padStart(2,'0')}</span>
                  )}
                </div>
              )}

              {/* File */}
              {msg.message_type === "file" && (
                <a href={msg.media_url} download={msg.media_filename} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <FileText className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[160px]">{msg.media_filename || "File"}</p>
                    <p className="text-xs opacity-70">{formatFileSize(msg.media_size_bytes)}</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0" />
                </a>
              )}

              {/* Call log */}
              {msg.message_type === "call_log" && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{msg.content}</span>
                </div>
              )}

              {/* Timestamp + status */}
              <div className={`flex items-center justify-end gap-1 mt-1 ${isSelf ? "text-white/60" : "text-muted-foreground"}`}>
                <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                {isSelf && (
                  msg.status === "read" ? <CheckCheck className="w-3 h-3 text-blue-300" /> : <Check className="w-3 h-3" />
                )}
              </div>

              {/* Quick actions */}
              <div className={`absolute top-1 ${isSelf ? "left-0 -translate-x-full pl-0 pr-1" : "right-0 translate-x-full pl-1"} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <button onClick={() => setReplyTo(msg)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                  <Reply className="w-3 h-3 text-muted-foreground" />
                </button>
                {isSelf && (
                  <button onClick={() => handleDeleteMessage(msg.id)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20">
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Send className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-serif font-semibold text-foreground mb-2">Select a conversation</h3>
        <p className="text-muted-foreground text-sm max-w-xs">Choose a conversation from the sidebar, or go to a profile and send an interest to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shadow-sm shrink-0">
        <Avatar className="w-10 h-10 border-2 border-primary/20">
          <AvatarImage src={partnerProfile?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{partnerName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{partnerName}</h3>
          {partnerTyping ? (
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              typing...
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {partnerProfile?.profession_type ? `${partnerProfile.profession_type} • ` : ""}{partnerProfile?.city || ""}
            </p>
          )}
        </div>
        {isMutualMatch && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onCallStart?.("voice")}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              title="Voice call"
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => onCallStart?.("video")}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              title="Video call"
            >
              <VideoIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors ml-1">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
              <Flag className="w-4 h-4 mr-2" />
              Report {partnerName}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlockUser}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              Block {partnerName}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        reportedUserId={partnerProfile?.id}
        reportedName={partnerName}
      />

      {/* Blocked message */}
      {isBlocked && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">You have blocked this conversation.</p>
        </div>
      )}

      {/* Not mutual — info bar */}
      {!isMutualMatch && !isBlocked && (
        <div className="bg-secondary/10 border-b border-secondary/20 px-4 py-2 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-secondary shrink-0" />
          <p className="text-xs text-secondary font-medium">Media sharing & calls unlock after mutual interest acceptance</p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          setShowScrollBtn(el.scrollTop < el.scrollHeight - el.clientHeight - 100);
        }}
      >
        {messages.map((msg, i) => renderMessage(msg, messages[i - 1]))}
        {partnerTyping && (
          <div className="flex justify-start mb-1">
            <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowDown className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-3">
          <div className="flex-1 border-l-2 border-primary pl-3">
            <p className="text-xs text-primary font-medium">Replying to message</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content || (replyTo.message_type !== "text" ? `[${replyTo.message_type}]` : "")}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-3 border-t border-border bg-white shrink-0">
        {isBlocked ? (
          <div className="flex items-center justify-center p-2">
            <p className="text-sm text-muted-foreground">You cannot send messages to a blocked user.</p>
          </div>
        ) : showVoiceRecorder ? (
          <VoiceMessageRecorder
            onSend={handleVoiceSend}
            onCancel={() => setShowVoiceRecorder(false)}
            disabled={uploading}
          />
        ) : (
          <div className="flex items-end gap-2">
            {/* Media buttons — only when mutual */}
            {isMutualMatch && (
              <div className="flex items-center gap-1 pb-0.5">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <input ref={anyFileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors" title="Send photo">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => videoInputRef.current?.click()} disabled={uploading}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors" title="Send video">
                  <VideoIcon className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => anyFileInputRef.current?.click()} disabled={uploading}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors" title="Send file">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Text input */}
            <div className="flex-1 flex items-center bg-muted/50 border border-border rounded-2xl px-3 py-2 gap-2 min-h-[44px]">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendText())}
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                disabled={sending || uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Voice / Send */}
            {newMessage.trim() ? (
              <button
                onClick={handleSendText}
                disabled={sending}
                className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center shadow-sm transition-all active:scale-95"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            ) : isMutualMatch ? (
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center shadow-sm transition-all active:scale-95"
                title="Voice message"
              >
                <Mic className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                onClick={handleSendText}
                disabled={sending || !newMessage.trim()}
                className="w-11 h-11 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxImg} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
