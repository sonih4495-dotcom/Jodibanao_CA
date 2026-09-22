"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (audioBlob: Blob, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceMessageRecorder({ onSend, onCancel, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setSending(true);
    try {
      await onSend(audioBlob, duration);
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3">
      {!audioBlob ? (
        <>
          <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-sm font-mono font-medium text-foreground flex-1">
            {isRecording ? formatDuration(duration) : "Press record"}
          </span>
          {!isRecording ? (
            <Button size="sm" onClick={startRecording} className="gap-1.5 bg-primary text-white h-8 px-3" disabled={disabled}>
              <Mic className="w-3.5 h-3.5" /> Record
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5 h-8 px-3">
              <Square className="w-3.5 h-3.5" /> Stop
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Voice message ready</p>
            <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
          </div>
          <Button size="sm" onClick={handleSend} disabled={sending} className="gap-1.5 bg-primary text-white h-8 px-3">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAudioBlob(null); setDuration(0); }} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
