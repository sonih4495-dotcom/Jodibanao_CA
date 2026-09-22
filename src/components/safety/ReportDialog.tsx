"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedName: string;
}

const REASONS = [
  { value: "fake_profile", label: "Fake Profile" },
  { value: "harassment", label: "Harassment or Abuse" },
  { value: "inappropriate_photo", label: "Inappropriate Photo" },
  { value: "scam", label: "Scam or Fraud" },
  { value: "impersonation", label: "Impersonation" },
  { value: "married_misleading", label: "Married / Misleading Status" },
  { value: "other", label: "Other" },
];

export function ReportDialog({ open, onClose, reportedUserId, reportedName }: ReportDialogProps) {
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [blockUser, setBlockUser] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const currentUserId = session.user.id;

      // Check if already reported
      const { data: existingReport } = await supabase
        .from("reports")
        .select("id")
        .eq("reporter_id", currentUserId)
        .eq("reported_id", reportedUserId)
        .maybeSingle();

      if (existingReport) {
        toast.info("You have already reported this user.");
      } else {
        const { error: reportError } = await supabase.from("reports").insert({
          reporter_id: currentUserId,
          reported_id: reportedUserId,
          reason,
          details: details.trim() || null,
          status: "pending",
        });
        
        if (reportError) throw reportError;
      }

      // Handle block
      if (blockUser) {
        const { data: existingBlock } = await supabase
          .from("blocked_users")
          .select("id")
          .eq("blocker_id", currentUserId)
          .eq("blocked_id", reportedUserId)
          .maybeSingle();
          
        if (!existingBlock) {
          const { error: blockError } = await supabase.from("blocked_users").insert({
            blocker_id: currentUserId,
            blocked_id: reportedUserId,
          });
          
          if (blockError) throw blockError;
          toast.success("User blocked.");
        }
      }

      setDone(true);
      if (!existingReport) {
        toast.success("Report submitted successfully.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setSubmitting(false);
      setTimeout(() => { onClose(); setDone(false); setReason(""); setDetails(""); setBlockUser(false); }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" /> Report Profile
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. All reports are reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Report Submitted</h3>
            <p className="text-muted-foreground text-sm">
              Thank you. Our team will review <span className="font-medium">{reportedName}</span>'s profile shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are reporting <span className="font-semibold text-foreground">{reportedName}</span>. 
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Reason *</Label>
                <Select value={reason} onValueChange={(v: string | null) => setReason(v ?? "")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Additional Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea 
                placeholder="Describe the issue in more detail..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="block-user" 
                checked={blockUser} 
                onCheckedChange={(checked) => setBlockUser(!!checked)} 
              />
              <Label htmlFor="block-user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Also block this user from contacting me
              </Label>
            </div>
          </div>
        )}

        {!done && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason || submitting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

