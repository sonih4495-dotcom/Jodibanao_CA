"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const NOTIFICATION_ICONS: Record<string, string> = {
  interest_received: "💌",
  interest_accepted: "❤️",
  mutual_match: "🎉",
  new_message: "💬",
  profile_viewed: "👁️",
  membership_expiry: "⚠️",
  system: "🔔",
};

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (data) setNotifications(data);
    };

    loadNotifications();

    // Realtime: listen for new notifications for this user
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => { 
      setOpen(isOpen); 
      if (!isOpen) markAllRead();
    }}>
      <PopoverTrigger className="inline-flex items-center justify-center rounded-lg text-sm font-medium hover:bg-muted aria-expanded:bg-muted transition-colors relative text-foreground hover:text-primary h-8 w-8">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border border-border rounded-2xl overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-600 border-0 text-xs hover:bg-red-100">
              {unreadCount} New
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up!
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-4 py-3 flex gap-3 text-sm transition-colors hover:bg-muted/30 cursor-default ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{NOTIFICATION_ICONS[notif.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground leading-snug truncate">{notif.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{notif.body}</p>
                  <p className="text-muted-foreground/60 text-[10px] mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/10 text-center">
            <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline">
              View all activity
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
