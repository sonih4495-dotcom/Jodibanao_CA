"use client";

import { Phone, Video, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  callerName: string;
  callerAvatar?: string;
  callType: "voice" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({ callerName, callerAvatar, callType, onAccept, onDecline }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Incoming {callType === "video" ? "Video" : "Voice"} Call
          </p>
        </div>
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
          <AvatarImage src={callerAvatar} alt={callerName} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">{callerName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-1">{callerName}</h2>
        <p className="text-sm text-muted-foreground mb-8">is calling you...</p>
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            {callType === "video" ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
