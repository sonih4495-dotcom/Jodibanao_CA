"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedName: string;
}

const REASONS = [
  { value: "fake_profile", label: "Fake / Fraudulent Profile" },
  { value: "abusive", label: "Abusive or Threatening Behavior" },
  { value: "spam", label: "Spam or Solicitation" },
  { value: "married", label: "Already Married" },
  { value: "wrong_info", label: "Incorrect / Misleading Information" },
  { value: "inappropriate_photo", label: "Inappropriate Photo" },
  { value: "other", label: "Other" },
];

export function ReportDialog({ open, onClose, reportedUserId, reportedName }: ReportDialogProps) {
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("reports").insert({
      reporter_id: session.user.id,
      reported_id: reportedUserId,
      reason,
      details: details.trim() || null,
    });

    setDone(true);
    setSubmitting(false);
    setTimeout(() => { onClose(); setDone(false); setReason(""); setDetails(""); }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" /> Report Profile
          </DialogTitle>
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
              All reports are reviewed by our safety team.
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
