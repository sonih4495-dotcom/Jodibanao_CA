"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface VideoCallModalProps {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  onClose: () => void;
}

export function VideoCallModal({
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatar,
  onClose,
}: VideoCallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
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
        call_type: "video",
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative bg-neutral-900 flex items-center justify-center overflow-hidden">
        
        {/* Partner Video Simulation */}
        {status === "Connecting..." || status === "Ended" ? (
          <div className="flex flex-col items-center gap-4">
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
            <h2 className="text-xl font-medium text-white">{partnerName}</h2>
            <p className="text-white/60">{status}</p>
          </div>
        ) : (
          <>
            {/* Main Video (Partner) */}
            <div className="absolute inset-0">
              <img 
                src={partnerAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop"} 
                alt="Partner Video" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* PIP Video (Self) */}
            <div className="absolute top-6 right-6 w-32 h-44 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
              {isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <User className="w-8 h-8 text-white/50" />
                </div>
              ) : (
                <video 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                  ref={node => {
                    if (node && !node.srcObject) {
                      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                        node.srcObject = stream;
                      }).catch(() => {
                        // fallback if no camera permission
                      });
                    }
                  }}
                />
              )}
            </div>

            {/* Top Bar Info */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-medium">{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-neutral-950 flex items-center justify-center gap-6 pb-safe">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg ml-2"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
