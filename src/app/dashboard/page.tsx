"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, MessageCircle, Star, Settings, Bell, ShieldCheck, ChevronRight, Activity, ArrowRight, Loader2, PartyPopper, Inbox, Send, Eye, GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/client";
import { calculateMatchScore } from "@/utils/matchScore";
import { toast } from "sonner";
import { ProfileCompletion } from "@/components/ui/profile-completion";
import { SkeletonProfileGrid } from "@/components/ui/skeleton-profile-card";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [acceptedMatches, setAcceptedMatches] = useState<any[]>([]);
  const [incomingInterests, setIncomingInterests] = useState<any[]>([]);
  const [sentInterests, setSentInterests] = useState<any[]>([]);
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

      // 1. Fetch Accepted Interests (Mutual Matches)
      const { data: acceptedData } = await supabase
        .from('interests')
        .select(`
          *,
          sender:profiles!interests_from_user_id_fkey(*),
          receiver:profiles!interests_to_user_id_fkey(*)
        `)
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (acceptedData) {
        const mapped = acceptedData.map(item => {
          const isSender = item.from_user_id === session.user.id;
          const partner = isSender ? item.receiver : item.sender;
          let age = 25;
          if (partner?.dob) {
            age = new Date().getFullYear() - new Date(partner.dob).getFullYear();
          }
          return {
            ...item,
            partner,
            age
          };
        }).filter(item => item.partner); // Ensure partner profile exists
        setAcceptedMatches(mapped);
      }

      // 2. Fetch Incoming Pending Interests
      const { data: incoming } = await supabase
        .from('interests')
        .select(`
          *,
          sender:profiles!interests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (incoming) setIncomingInterests(incoming);

      // 3. Fetch Sent Interests
      const { data: sent } = await supabase
        .from('interests')
        .select(`
          *,
          receiver:profiles!interests_to_user_id_fkey(*)
        `)
        .eq('from_user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (sent) setSentInterests(sent);

      // 4. Fetch Recommendations (strictly opposite gender)
      const userGender = userProfile?.gender?.toLowerCase()?.trim();
      const targetGender = userGender === 'male' ? 'female' : userGender === 'female' ? 'male' : null;

      let recQuery = supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id);

      if (targetGender) {
        recQuery = recQuery.ilike('gender', targetGender);
      }

      const { data: allProfiles } = await recQuery.limit(25);
        
      if (allProfiles && userProfile) {
        // filter out profiles I already sent interests to or received from
        const interactedIds = new Set([
          ...(incoming || []).map(i => i.from_user_id),
          ...(sent || []).map(i => i.to_user_id),
          ...(acceptedData || []).flatMap(a => [a.from_user_id, a.to_user_id])
        ]);

        const available = allProfiles.filter(p => {
          if (interactedIds.has(p.id)) return false;
          if (targetGender && p.gender && p.gender.toLowerCase().trim() !== targetGender) return false;
          return true;
        });

        const scored = available.map(p => {
          let age = 25;
          if (p.dob) age = new Date().getFullYear() - new Date(p.dob).getFullYear();
          return { ...p, calculatedScore: calculateMatchScore(userProfile, p), age };
        }).sort((a, b) => b.calculatedScore - a.calculatedScore).slice(0, 3);
        setRecommendations(scored);
      }

      setLoading(false);
    }
    loadDashboard();
  }, [supabase]);

  const handleInterest = async (interestId: string, action: 'accepted' | 'declined', senderName: string, senderId?: string) => {
    if (action === 'accepted' && (!currentUser.first_name || currentUser.first_name.trim() === '')) {
      toast.warning("Please complete your profile (add your First Name) before accepting interests.");
      router.push("/profile/edit?highlight=missing");
      return;
    }

    const acceptedItem = incomingInterests.find(i => i.id === interestId);
    setIncomingInterests(prev => prev.filter(i => i.id !== interestId));

    const { error } = await supabase
      .from('interests')
      .update({ status: action })
      .eq('id', interestId);

    if (action === 'accepted' && !error) {
      setMutualMatchTrigger(senderName);
      if (acceptedItem && acceptedItem.sender) {
        let age = 25;
        if (acceptedItem.sender.dob) {
          age = new Date().getFullYear() - new Date(acceptedItem.sender.dob).getFullYear();
        }
        setAcceptedMatches(prev => [{ ...acceptedItem, status: 'accepted', partner: acceptedItem.sender, age }, ...prev]);
      }
      setTimeout(() => setMutualMatchTrigger(null), 5000);
    } else if (action === 'declined') {
      toast.info("Interest declined.");
    } else if (error) {
      toast.error("Failed to respond to interest. Please try again.");
    }
  };

  const handleSendInterest = async (toUserId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('interests').insert({
      from_user_id: currentUser.id,
      to_user_id: toUserId,
      status: 'pending'
    });
    
    if (error) {
      toast.error('Failed to send interest.');
    } else {
      toast.success('Interest sent successfully!');
      setRecommendations(prev => prev.filter(r => r.id !== toUserId));
      
      const newSent = {
        id: Math.random().toString(),
        to_user_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
        receiver: recommendations.find(r => r.id === toUserId)
      };
      setSentInterests(prev => [newSent, ...prev]);
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/20 min-h-screen flex flex-col pt-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <SkeletonProfileGrid count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 min-h-screen flex flex-col pb-12">
      {mutualMatchTrigger && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500 delay-100 flex flex-col items-center p-6">
            <PartyPopper className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Mutual Match!</h2>
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

      {/* Top Banner */}
      <div className="bg-primary text-white py-12 px-4 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-4xl font-serif font-bold shadow-lg overflow-hidden relative">
              {currentUser?.first_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Welcome back, {currentUser?.first_name}!</h1>
              <p className="text-primary-foreground/80 font-medium">
                {acceptedMatches.length} Accepted Matches • {incomingInterests.length} Pending Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 flex flex-col gap-1 sticky top-24">
            <Link href="/dashboard" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all bg-primary/10 text-primary hover:bg-primary/15">
              <div className="flex items-center gap-3"><Activity className="w-5 h-5" /> Dashboard Overview</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/discover" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><Heart className="w-5 h-5" /> Discover Matches</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/browse" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><User className="w-5 h-5" /> Browse Profiles</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/messages" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5" /> Messages</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
            <Link href="/profile/edit" className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <div className="flex items-center gap-3"><Settings className="w-5 h-5" /> Edit Profile</div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          
          <ProfileCompletion profile={currentUser} />

          {/* Interests & Matches Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
            <Tabs defaultValue={acceptedMatches.length > 0 ? "accepted" : (incomingInterests.length > 0 ? "incoming" : "sent")} className="w-full">
              <TabsList className="mb-6 grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="accepted" className="flex gap-1.5 font-medium">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Matches ({acceptedMatches.length})
                </TabsTrigger>
                <TabsTrigger value="incoming" className="flex gap-1.5 font-medium">
                  <Inbox className="w-4 h-4" /> Incoming ({incomingInterests.length})
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex gap-1.5 font-medium">
                  <Send className="w-4 h-4" /> Sent ({sentInterests.length})
                </TabsTrigger>
              </TabsList>
              
              {/* TAB 1: ACCEPTED MATCHES */}
              <TabsContent value="accepted">
                {acceptedMatches.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No Accepted Matches Yet</h3>
                    <p className="text-muted-foreground max-w-sm">When you and another member accept each other&apos;s interests, your mutual matches will appear here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {acceptedMatches.map((match) => (
                      <div key={match.id} className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-5 rounded-2xl border border-border/80 hover:bg-muted/20 hover:border-primary/30 transition-all shadow-xs">
                        
                        {/* Profile Photo & Info (Clickable to open profile) */}
                        <Link href={`/profile/${match.partner?.id}`} className="flex items-center gap-4 flex-1 text-center sm:text-left group">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20 overflow-hidden relative group-hover:border-primary transition-colors">
                            {match.partner?.avatar_url ? (
                              <img src={match.partner.avatar_url} alt={match.partner.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold font-serif text-primary">
                                {match.partner?.first_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                              <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                {match.partner?.first_name} {match.partner?.last_name}
                              </h4>
                              {match.age && <span className="text-sm text-muted-foreground">({match.age} yrs)</span>}
                              {match.partner?.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {match.partner?.city || "Location unknown"} • {match.partner?.profession || match.partner?.profession_type || "CA/CS Professional"}
                            </p>
                            {match.partner?.profession_type && (
                              <Badge className="bg-secondary/10 text-secondary border-secondary/30 text-[11px] mt-1.5 font-semibold">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {match.partner.profession_type}
                              </Badge>
                            )}
                          </div>
                        </Link>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/messages?with=${match.partner?.id}`}>
                            <Button className="bg-primary hover:bg-primary-hover text-white h-9 px-5 gap-1.5 shadow-sm">
                              <MessageCircle className="w-4 h-4" /> Message
                            </Button>
                          </Link>
                          <Link href={`/profile/${match.partner?.id}`}>
                            <Button variant="outline" className="h-9 px-4 gap-1.5 hover:bg-muted">
                              <Eye className="w-4 h-4" /> View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* TAB 2: INCOMING INTERESTS */}
              <TabsContent value="incoming">
                {incomingInterests.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Inbox className="w-8 h-8 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No Incoming Interests</h3>
                    <p className="text-muted-foreground max-w-sm">When someone sends you an interest, it will appear here. Enhance your profile to get more matches!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {incomingInterests.map((interest) => (
                      <div key={interest.id} className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-5 rounded-2xl border border-border/80 hover:bg-muted/20 transition-all shadow-xs">
                        
                        {/* Profile Info (Clickable to open profile) */}
                        <Link href={`/profile/${interest.sender?.id}`} className="flex items-center gap-4 flex-1 text-center sm:text-left group">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20 overflow-hidden relative group-hover:border-primary transition-colors">
                            {interest.sender?.avatar_url ? (
                              <img src={interest.sender.avatar_url} alt={interest.sender.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold font-serif text-primary">
                                {interest.sender?.first_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                              {interest.sender?.first_name} {interest.sender?.last_name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {interest.sender?.city || "Location unknown"} • {interest.sender?.profession || interest.sender?.profession_type || "CA/CS Professional"}
                            </p>
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Received {new Date(interest.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end shrink-0">
                          <Button 
                            onClick={() => handleInterest(interest.id, 'accepted', interest.sender?.first_name || 'User', interest.sender?.id)}
                            className="bg-green-600 hover:bg-green-700 text-white h-9 px-5 font-semibold"
                          >
                            Accept
                          </Button>
                          <Button 
                            onClick={() => handleInterest(interest.id, 'declined', "User")}
                            variant="outline" 
                            className="h-9 px-4 hover:bg-destructive/10 hover:text-destructive"
                          >
                            Decline
                          </Button>
                          <Link href={`/messages?with=${interest.sender?.id}`}>
                            <Button variant="ghost" size="icon" title="Send direct message" className="h-9 w-9 text-primary hover:bg-primary/10">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/profile/${interest.sender?.id}`}>
                            <Button variant="ghost" size="icon" title="View Profile" className="h-9 w-9 hover:bg-muted">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* TAB 3: SENT INTERESTS */}
              <TabsContent value="sent">
                {sentInterests.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Send className="w-8 h-8 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No Sent Interests</h3>
                    <p className="text-muted-foreground max-w-sm">You haven&apos;t sent any interests yet. Check out Discover or Browse to find potential matches.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sentInterests.map((interest) => (
                      <div key={interest.id} className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-5 rounded-2xl border border-border/80 hover:bg-muted/20 transition-all shadow-xs">
                        
                        {/* Profile Info (Clickable to open profile) */}
                        <Link href={`/profile/${interest.receiver?.id}`} className="flex items-center gap-4 flex-1 text-center sm:text-left group">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20 overflow-hidden relative group-hover:border-primary transition-colors">
                            {interest.receiver?.avatar_url ? (
                              <img src={interest.receiver.avatar_url} alt={interest.receiver.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold font-serif text-primary">
                                {interest.receiver?.first_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                              <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                {interest.receiver?.first_name} {interest.receiver?.last_name}
                              </h4>
                              <Badge variant="outline" className={`text-xs ${
                                interest.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-300' :
                                interest.status === 'declined' ? 'bg-red-100 text-red-700 border-red-300' :
                                'bg-amber-100 text-amber-700 border-amber-300'
                              }`}>
                                {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {interest.receiver?.city || "Location unknown"} • {interest.receiver?.profession || interest.receiver?.profession_type || "CA/CS Professional"}
                            </p>
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Sent {new Date(interest.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/messages?with=${interest.receiver?.id}`}>
                            <Button variant="outline" className="h-9 px-4 gap-1.5 text-primary border-primary/30 hover:bg-primary/10">
                              <MessageCircle className="w-4 h-4" /> Message
                            </Button>
                          </Link>
                          <Link href={`/profile/${interest.receiver?.id}`}>
                            <Button variant="ghost" className="h-9 px-4 gap-1.5 hover:bg-muted">
                              <Eye className="w-4 h-4" /> View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Daily Recommendations */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground">Daily Recommendations</h2>
              <Link href="/discover" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                Discover More <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {recommendations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-12 bg-white rounded-3xl border border-border shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Caught up for now!</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">We&apos;ll find more recommendations for you soon. Try updating your preferences.</p>
                  <Link href="/profile/edit">
                    <Button variant="outline">Update Preferences</Button>
                  </Link>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="overflow-hidden group border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                    <Link href={`/profile/${rec.id}`} className="block">
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
                    </Link>
                    <CardContent className="p-4 bg-card flex flex-col gap-3 flex-1">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">Profession</span>
                        <span className="truncate max-w-[120px] text-right">{rec.profession || "Not specified"}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">Community</span>
                        <span>{rec.religion || "Any"}</span>
                      </div>
                      <div className="mt-auto pt-4 flex gap-2">
                         <Button 
                           onClick={() => handleSendInterest(rec.id)}
                           className="flex-1 text-xs h-9 bg-primary hover:bg-primary-hover flex gap-1.5 items-center font-semibold"
                         >
                           <Heart className="w-4 h-4" /> Send Interest
                         </Button>
                         <Link href={`/messages?with=${rec.id}`}>
                           <Button variant="outline" size="icon" title="Send direct message" className="h-9 w-9 text-primary border-primary/30 hover:bg-primary/10">
                             <MessageCircle className="w-4 h-4" />
                           </Button>
                         </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
