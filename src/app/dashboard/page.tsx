"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Heart, MessageCircle, Star, Settings, Bell, ShieldCheck, ChevronRight, Activity, ArrowRight, Loader2, PartyPopper, GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/client";
import { calculateMatchScore } from "@/utils/matchScore";
import { toast } from "sonner";


export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingInterests, setIncomingInterests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mutualMatchTrigger, setMutualMatchTrigger] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      setCurrentUser(userProfile);

      // 1. Fetch Incoming Pending Interests
      const { data: interests } = await supabase
        .from('interests')
        .select(`
          *,
          sender:profiles!interests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (interests) setIncomingInterests(interests);

      // 2. Fetch Recommendations (profiles excluding me and excluding pending/accepted interactions)
      // For simplicity, we fetch a few profiles and score them
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id)
        .limit(10);
        
      if (allProfiles && userProfile) {
        const scored = allProfiles.map(p => {
          let age = 25;
          if (p.dob) age = new Date().getFullYear() - new Date(p.dob).getFullYear();
          return { ...p, calculatedScore: calculateMatchScore(userProfile, p), age };
        }).sort((a, b) => b.calculatedScore - a.calculatedScore).slice(0, 3);
        setRecommendations(scored);
      }

      setLoading(false);
    }
    loadDashboard();
  }, []);

  const handleInterest = async (interestId: string, action: 'accepted' | 'declined', senderName: string) => {
    // Prevent trigger failures if the user data is empty
    if (action === 'accepted' && (!currentUser.first_name || currentUser.first_name.trim() === '')) {
      toast.warning("Please complete your profile (add your First Name) before accepting interests.");
      router.push("/profile/edit?highlight=missing");
      return;
    }

    // Optimistic UI update
    setIncomingInterests(prev => prev.filter(i => i.id !== interestId));

    const { error } = await supabase
      .from('interests')
      .update({ status: action })
      .eq('id', interestId);

    if (action === 'accepted' && !error) {
      // Trigger confetti and celebration UI
      setMutualMatchTrigger(senderName);
      setTimeout(() => setMutualMatchTrigger(null), 5000); // clear after 5s
    } else if (action === 'declined') {
      toast.info("Interest declined.");
    } else if (error) {
      toast.error("Failed to respond to interest. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/20 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const coreFields = ['avatar_url', 'about_me', 'education', 'profession', 'income', 'city', 'diet', 'smoking', 'drinking'];
  const filledFields = coreFields.filter(f => currentUser?.[f]).length;
  const profileCompletePercent = currentUser ? Math.round((filledFields / coreFields.length) * 100) : 0;

  return (
    <div className="bg-muted/20 min-h-screen flex flex-col">
      
      {/* Mutual Match Celebration Overlay */}
      {mutualMatchTrigger && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500 delay-100 flex flex-col items-center">
            <PartyPopper className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
            <h2 className="text-5xl font-serif font-bold text-white mb-4">Mutual Match!</h2>
            <p className="text-xl text-white/90 mb-8 max-w-md">
              You and <span className="text-pink-400 font-bold">{mutualMatchTrigger}</span> liked each other. You can now chat!
            </p>
            <div className="flex gap-4">
              <Link href="/messages">
                <Button className="bg-pink-500 hover:bg-pink-600 text-white px-8 h-12 text-lg shadow-lg">
                  Send Message
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setMutualMatchTrigger(null)} className="h-12 border-white text-foreground hover:bg-white/10 px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-primary text-white py-12 px-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-4xl font-serif font-bold shadow-lg overflow-hidden relative">
              {currentUser?.first_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Welcome back, {currentUser?.first_name}!</h1>
              <p className="text-primary-foreground/80 font-medium">
                You have {incomingInterests.length} new interest requests.
              </p>
            </div>
          </div>
          <Link href="/profile/edit?highlight=missing" className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl w-full md:w-64 text-center hidden md:block hover:bg-white/20 transition-colors group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Profile Completion</p>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000" 
                style={{ width: `${profileCompletePercent}%` }}
              />
            </div>
            <p className="text-xs font-bold text-left">{profileCompletePercent}% Complete <span className="font-normal opacity-80 ml-1">(Click to complete)</span></p>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8 flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 flex flex-col gap-1 sticky top-24">
            <Link href="/dashboard" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all bg-primary/10 text-primary hover:bg-primary/15">
              <div className="flex items-center gap-3"><Activity className="w-5 h-5" /> Dashboard Overview</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/browse" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><Star className="w-5 h-5" /> Browse Profiles</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/messages" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5" /> Messages</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/profile/edit" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><User className="w-5 h-5" /> Edit Profile</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/membership" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Membership</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Incoming Interests Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Pending Interests ({incomingInterests.length})
            </h2>
            
            {incomingInterests.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">You have no pending interest requests at the moment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {incomingInterests.map((interest) => (
                  <div key={interest.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden relative">
                       {/* Blur logic if not premium, simplified for now */}
                       <ShieldCheck className="w-8 h-8 text-primary/50" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-semibold text-lg mb-1">{interest.sender?.first_name} {interest.sender?.last_name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {interest.sender?.city} • {interest.sender?.profession || "Professional"}
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-start">
                        <Button 
                          onClick={() => handleInterest(interest.id, 'accepted', interest.sender?.first_name || 'User')}
                          className="bg-green-600 hover:bg-green-700 text-white h-9 px-6"
                        >
                          Accept
                        </Button>
                        <Button 
                          onClick={() => handleInterest(interest.id, 'declined', "User")}
                          variant="outline" 
                          className="h-9 px-6 hover:bg-destructive/10 hover:text-destructive"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-2 sm:mt-0">
                      {new Date(interest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Recommendations */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground">Daily Recommendations</h2>
              <Link href="/browse" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                View All Matches <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="overflow-hidden group border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                    <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-sm font-medium">
                      {rec.calculatedScore}% Match
                    </Badge>
                    <div className="absolute inset-0 z-0 bg-gradient-to-tr from-primary/30 to-secondary/30 backdrop-blur-2xl flex items-center justify-center">
                       <ShieldCheck className="w-12 h-12 text-foreground/20 opacity-50" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pointer-events-none">
                      <h3 className="text-white font-serif font-bold text-lg mb-0.5">{rec.first_name}, {rec.age}</h3>
                      <p className="text-white/80 text-xs">{rec.education || 'Graduate'} • {rec.city}</p>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-card flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground">Profession</span>
                      <span className="truncate max-w-[120px] text-right">{rec.profession || "Not specified"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground">Community</span>
                      <span>{rec.religion || "Any"}</span>
                    </div>
                    <div className="grid grid-cols-1 mt-2">
                       <Link href="/browse">
                         <Button className="w-full text-xs h-9 bg-primary hover:bg-primary-hover">Send Interest</Button>
                       </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
