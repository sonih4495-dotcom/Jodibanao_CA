"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface VoiceCallModalProps {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  onClose: () => void;
}

export function VoiceCallModal({
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatar,
  onClose,
}: VoiceCallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const supabase = createClient();

  useEffect(() => {
    // Simulate connection phase
    const connectTimer = setTimeout(() => {
      setStatus("Connected");
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "Connected") {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleEndCall = async () => {
    setStatus("Ended");
    
    // Log to call_logs table
    try {
      await supabase.from("call_logs").insert({
        caller_id: currentUserId,
        callee_id: partnerId,
        call_type: "voice",
        status: "completed",
        duration_seconds: duration
      });
      toast.success("Call ended.");
    } catch (error) {
      console.error("Failed to log call:", error);
    }

    // Small delay before closing so user sees "Ended"
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Header Info */}
      <div className="flex flex-col items-center gap-4 mb-16">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-primary/30">
            <AvatarImage src={partnerAvatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-3xl">
              {partnerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {status === "Connecting..." && (
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          )}
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{partnerName}</h2>
          <p className={`text-lg mt-2 ${status === "Connected" ? "text-green-400" : "text-white/60"}`}>
            {status === "Connected" ? formatTime(duration) : status}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mt-12">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}
