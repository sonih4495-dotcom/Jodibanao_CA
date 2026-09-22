"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart, MessageCircle, ShieldCheck, GraduationCap, MapPin, Briefcase,
  User, Flag, ArrowLeft, Loader2, CheckCircle2, Lock, Share2, BookmarkPlus,
  Calendar, Users, Utensils, Home, Star, MoreVertical, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/safety/ReportDialog";

function ProfileDetailContent() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [interestStatus, setInterestStatus] = useState<"none" | "sent" | "received" | "accepted" | "mutual">("none");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [photoBlurred, setPhotoBlurred] = useState(true);
  
  // Report and Block State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setCurrentUser(session.user);

      // Fetch the profile being viewed
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (profileError || !profileData) {
        toast.error("Profile not found.");
        router.push("/browse");
        return;
      }
      setProfile(profileData);

      // Fetch current user's profile
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      setCurrentUserProfile(myProfile);

      // Check interest status
      // Did I send interest to them?
      const { data: sentInterest } = await supabase
        .from("interests")
        .select("id, status")
        .eq("from_user_id", session.user.id)
        .eq("to_user_id", profileId)
        .maybeSingle();

      // Did they send interest to me?
      const { data: receivedInterest } = await supabase
        .from("interests")
        .select("id, status")
        .eq("from_user_id", profileId)
        .eq("to_user_id", session.user.id)
        .maybeSingle();

      // Determine mutual match
      const isMutual = sentInterest?.status === "accepted" && receivedInterest?.status === "accepted";
      if (isMutual) {
        setInterestStatus("mutual");
      } else if (sentInterest?.status === "accepted") {
        setInterestStatus("accepted");
      } else if (sentInterest) {
        setInterestStatus("sent");
      } else if (receivedInterest) {
        setInterestStatus("received");
      } else {
        setInterestStatus("none");
      }

      // Photo visibility
      if (profileData.photo_visibility === "everyone") {
        setPhotoBlurred(false);
      } else if (profileData.photo_visibility === "mutual" && isMutual) {
        setPhotoBlurred(false);
      } else if (profileData.photo_visibility === "verified_only" && myProfile?.is_verified) {
        setPhotoBlurred(false);
      } else {
        setPhotoBlurred(true);
      }

      // Log profile view (don't await — fire and forget)
      supabase.from("profile_views").insert({
        viewer_id: session.user.id,
        viewed_id: profileId,
      }).then(() => {});

      setLoading(false);
    };
    init();
  }, [profileId]);

  const handleSendInterest = async () => {
    if (!currentUser || interestStatus !== "none") return;
    setSendingInterest(true);
    try {
      const { error } = await supabase.from("interests").insert({
        from_user_id: currentUser.id,
        to_user_id: profileId,
        status: "pending",
      });
      if (error) throw error;

      // Create notification for the recipient
      await supabase.from("notifications").insert({
        user_id: profileId,
        type: "interest_received",
        title: "Someone sent you an interest!",
        message: `${currentUserProfile?.first_name || "Someone"} is interested in your profile.`,
        from_user_id: currentUser.id,
      });

      setInterestStatus("sent");
      toast.success("Interest sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send interest.");
    } finally {
      setSendingInterest(false);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to block this user? They will no longer be able to contact you.")) return;
    
    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: currentUser.id,
        blocked_id: profileId,
      });
      if (error) throw error;
      toast.success("User blocked.");
      router.push("/browse");
    } catch (err: any) {
      toast.error(err.message || "Failed to block user.");
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied!");
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const age = calculateAge(profile.dob);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
  const initials = (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "");

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top action bar */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Link href={`/messages?with=${profileId}`}>
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-sm">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Message</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsSaved(!isSaved)} className={`gap-2 ${isSaved ? "text-secondary" : ""}`}>
              <BookmarkPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
                  <Flag className="w-4 h-4 mr-2" />
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlockUser}>
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ReportDialog
              open={reportDialogOpen}
              onClose={() => setReportDialogOpen(false)}
              reportedUserId={profileId}
              reportedName={fullName}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN — Photo + Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Photo Card */}
            <Card className="overflow-hidden border-border shadow-sm">
              <div className="aspect-[4/5] relative bg-muted">
                {profile.avatar_url && !photoBlurred ? (
                  <img
                    src={profile.avatar_url}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <User className="w-12 h-12 text-primary/50" />
                    </div>
                    {photoBlurred && profile.avatar_url && (
                      <div className="text-center px-4">
                        <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {profile.photo_visibility === "mutual" ? "Photo visible after mutual interest" : "Photo visible to verified members"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {/* Gradient overlay with name */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                  <h1 className="text-white font-serif font-bold text-2xl leading-tight">
                    {fullName}{age ? `, ${age}` : ""}
                  </h1>
                  <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.city || "Location not set"}
                  </p>
                  {profile.is_verified && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-green-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified CA/CS Member
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* CA/CS Badge */}
            {profile.profession_type && (
              <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-xl p-3">
                <GraduationCap className="w-5 h-5 text-secondary shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-secondary">{profile.profession_type}</p>
                  {profile.membership_number && (
                    <p className="text-xs text-muted-foreground">ID: {profile.membership_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* Direct Message Option - Always Available */}
              <Link href={`/messages?with=${profileId}`}>
                <Button className="w-full bg-primary hover:bg-primary-hover text-white gap-2 shadow-sm font-semibold active:scale-95 transition-transform">
                  <MessageCircle className="w-4 h-4" /> Message {profile.first_name || ""}
                </Button>
              </Link>

              {interestStatus === "mutual" ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-green-800">It's a Mutual Match! 🎉</p>
                </div>
              ) : interestStatus === "sent" ? (
                <Button disabled className="w-full gap-2 border-primary/30 text-primary" variant="outline">
                  <Heart className="w-4 h-4 fill-primary" /> Interest Sent
                </Button>
              ) : interestStatus === "received" ? (
                <Link href="/dashboard">
                  <Button className="w-full bg-secondary hover:bg-secondary-hover text-white gap-2" variant="default">
                    <Heart className="w-4 h-4" /> Respond to Interest
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleSendInterest}
                  disabled={sendingInterest}
                  variant="outline"
                  className="w-full border-primary/40 text-primary hover:bg-primary/10 gap-2 active:scale-95 transition-transform"
                >
                  {sendingInterest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                  Send Interest
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* About Me */}
            {profile.about_me && (
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-serif font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-secondary" /> About Me
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{profile.about_me}</p>
                </CardContent>
              </Card>
            )}

            {/* Basic Details */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-serif font-semibold mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Basic Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Calendar} label="Age" value={age ? `${age} years` : null} />
                  <InfoRow icon={User} label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                  <InfoRow icon={MapPin} label="City" value={profile.city} />
                  <InfoRow icon={Users} label="Religion" value={profile.religion} />
                  {profile.caste && <InfoRow icon={Users} label="Caste / Community" value={profile.caste} />}
                  <InfoRow icon={Users} label="Mother Tongue" value={profile.mother_tongue} />
                </div>
              </CardContent>
            </Card>

            {/* Education & Career */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-serif font-semibold mb-5 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Education & Career
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={GraduationCap} label="Education" value={profile.education} />
                  <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
                  <InfoRow icon={Briefcase} label="Annual Income" value={profile.income} />
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-serif font-semibold mb-5 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" /> Lifestyle
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Utensils} label="Diet" value={profile.diet} />
                  <InfoRow icon={User} label="Smoking" value={profile.smoking} />
                  <InfoRow icon={User} label="Drinking" value={profile.drinking} />
                  <InfoRow icon={Home} label="Family Type" value={profile.family_type} />
                </div>
              </CardContent>
            </Card>

            {/* Family Background */}
            {(profile.father_occupation || profile.mother_occupation || profile.siblings !== null) && (
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-serif font-semibold mb-5 flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" /> Family Background
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={User} label="Father's Occupation" value={profile.father_occupation} />
                    <InfoRow icon={User} label="Mother's Occupation" value={profile.mother_occupation} />
                    {profile.siblings !== null && (
                      <InfoRow icon={Users} label="Siblings" value={profile.siblings?.toString()} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Partner Preferences */}
            {(profile.pref_min_age || profile.pref_religion || profile.pref_location) && (
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-serif font-semibold mb-5 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" /> Partner Preferences
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.pref_min_age && profile.pref_max_age && (
                      <InfoRow icon={Calendar} label="Preferred Age Range" value={`${profile.pref_min_age} – ${profile.pref_max_age} years`} />
                    )}
                    <InfoRow icon={Users} label="Preferred Religion" value={profile.pref_religion} />
                    <InfoRow icon={MapPin} label="Preferred Location" value={profile.pref_location} />
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <ProfileDetailContent />
    </Suspense>
  );
}
