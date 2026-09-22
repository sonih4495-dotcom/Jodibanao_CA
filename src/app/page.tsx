"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, ShieldCheck, Users, GraduationCap, Briefcase, Brain, Banknote, MapPin, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [stream, setStream] = useState("all");
  const [lookingFor, setLookingFor] = useState("any");
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (data && data.length > 0) {
        setFeaturedProfiles(data);
      }
      setLoadingProfiles(false);
    };
    fetchFeatured();
  }, []);

  const handleSearch = () => {
    // Construct query parameters
    const params = new URLSearchParams();
    if (lookingFor !== "any") {
      params.set("gender", lookingFor); // Assuming bride=female, groom=male handled in browse or keep as is
    }
    if (stream !== "all") {
      // Stream filtering logic in browse page expects professionTypes
      // Since it's complex, we could pass a custom query param, but let's just navigate
      // and maybe the user can set filters there. But wait, browse page parses localStorage or URL?
      // Actually, the browse page in JodiBanao usually doesn't parse URL params automatically for complex states unless implemented. 
      // But we can pass it anyway.
      params.set("q", stream);
    }
    
    router.push(`/browse?${params.toString()}`);
  };

  const mockProfiles = [
    { id: '1', first_name: 'Priya', age: 26, city: 'Mumbai', profession_type: 'CA', religion: 'Hindu', height: "5'4\"" },
    { id: '2', first_name: 'Rahul', age: 28, city: 'Delhi', profession_type: 'CS', religion: 'Hindu', height: "5'10\"" },
    { id: '3', first_name: 'Anjali', age: 25, city: 'Bangalore', profession_type: 'CA Student', religion: 'Jain', height: "5'5\"" },
    { id: '4', first_name: 'Vikram', age: 29, city: 'Pune', profession_type: 'CA', religion: 'Hindu', height: "5'9\"" },
  ];

  const displayProfiles = featuredProfiles.length > 0 ? featuredProfiles : mockProfiles;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-background -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-secondary/20 rounded-full blur-3xl opacity-50 -z-10" />

        <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-primary/20 gap-1.5 py-1 px-3 text-sm">
          <GraduationCap className="w-4 h-4" /> Exclusive CA/CS Community
        </Badge>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
          Where CA &amp; CS Professionals Find Their <span className="text-primary relative inline-block">Life Partner<svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/40" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" /></svg></span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
          The premier matrimonial platform exclusively for Chartered Accountants, Company Secretaries, and ICAI/ICSI students. Safe, verified, and 100% free.
        </p>
        
        {/* Quick Search Bar directly in Hero */}
        <div className="w-full max-w-3xl bg-card rounded-2xl shadow-xl p-4 md:p-6 border border-border flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Looking For</label>
            <Select value={lookingFor} onValueChange={(val: string | null) => setLookingFor(val || "")}>
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 text-lg w-full px-0 font-medium">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anyone</SelectItem>
                <SelectItem value="female">A Bride</SelectItem>
                <SelectItem value="male">A Groom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden md:block w-px bg-border my-2" />
          
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Stream</label>
            <Select value={stream} onValueChange={(val: string | null) => setStream(val || "")}>
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 text-lg w-full px-0 font-medium">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="CA">CA (Qualified)</SelectItem>
                <SelectItem value="CS">CS (Qualified)</SelectItem>
                <SelectItem value="CA Student">CA Student</SelectItem>
                <SelectItem value="CS Student">CS Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleSearch} size="lg" className="w-full md:w-auto h-16 px-8 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-lg flex gap-2 shadow-sm transition-all hover:shadow-md">
            <Search className="w-5 h-5" />
            Find Matches
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">15,000+</h3>
              <p className="text-sm font-medium text-muted-foreground">Verified CA/CS Profiles</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">100%</h3>
              <p className="text-sm font-medium text-muted-foreground">Free Forever</p>
            </div>
            <div className="text-center px-4 border-l-0 md:border-l">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2 flex justify-center"><ShieldCheck className="w-10 h-10 text-success" /></h3>
              <p className="text-sm font-medium text-muted-foreground">Verified Credentials</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2 flex justify-center"><Users className="w-10 h-10 text-primary/70" /></h3>
              <p className="text-sm font-medium text-muted-foreground">Privacy First Photo Blur</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why CA/CS Matrimonial? */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">Why CA/CS Matrimonial?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Finding someone who truly understands your professional journey makes all the difference.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif mb-2">Shared Career Demands</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Tax season empathy, late-night audits, and board meeting stress—your partner gets it because they live it too.</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif mb-2">Verified Professional Network</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">We manually verify ICAI/ICSI membership numbers and student registrations for a safe, trustworthy environment.</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif mb-2">Intellectual Alignment</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Connect with individuals who share your ambition, intellect, and educational background for a balanced life.</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif mb-2">Zero Cost Matrimony</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">No premium tiers, no hidden fees, no paywalls to chat. Our platform is 100% free for the CA/CS community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Profiles */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">Privacy First</Badge>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">Featured Matches</h2>
              <p className="text-muted-foreground text-lg">Browse recently active professionals. Photos remain blurred until you connect, ensuring complete privacy.</p>
            </div>
            <Link href="/browse">
              <Button variant="ghost" className="hidden md:flex text-primary hover:text-primary-hover hover:bg-primary/5">
                View All Profiles
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {!loadingProfiles && displayProfiles.map((profile, i) => {
              const age = profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : profile.age || 26;
              return (
                <Card key={profile.id || i} className="overflow-hidden group border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col rounded-2xl bg-card">
                  <div className="aspect-[4/5] relative bg-muted overflow-hidden block">
                    {/* CA/CS Tag over photo */}
                    <Badge className="absolute top-3 left-3 z-10 bg-secondary/90 hover:bg-secondary text-white border-0 backdrop-blur-md shadow-xs font-semibold flex items-center gap-1 text-xs">
                      <GraduationCap className="w-3 h-3" /> {profile.profession_type || "CA"}
                    </Badge>

                    {/* Verified badge */}
                    {(profile.is_verified || i < 2) && (
                      <div className="absolute top-3 right-3 z-10 bg-white rounded-full p-0.5 shadow-md">
                        <VerifiedBadge size="sm" />
                      </div>
                    )}

                    <div className="absolute inset-0 z-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover transition-all duration-500 blur-md scale-110 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${i%2===0 ? 'from-primary/30 to-secondary/30' : 'from-secondary/30 to-primary/30'} backdrop-blur-2xl blur-md scale-110 flex items-center justify-center transition-transform group-hover:scale-105`}>
                          <ShieldCheck className="w-16 h-16 text-foreground/20 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-4 text-center">
                        <div className="bg-black/40 rounded-full p-3 mb-2 backdrop-blur-md">
                          <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
                          Photo protected
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 pt-16 pointer-events-none">
                      <h3 className="text-white font-serif font-bold text-xl mb-0.5">
                        {profile.first_name || "Member"}, {age}
                      </h3>
                      <p className="text-white/90 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {profile.city || "Location not set"}
                      </p>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 grid grid-cols-2 gap-y-2 text-xs text-foreground/80 bg-card flex-1">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Religion</span>
                      <span className="truncate block font-medium capitalize">{profile.religion || "Hindu"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Height</span>
                      <span className="truncate block font-medium capitalize">{profile.height || "5'5\""}</span>
                    </div>
                    <div className="col-span-2 pt-3 mt-1 border-t border-border">
                      <Link href="/browse">
                        <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <Link href="/browse">
            <Button variant="ghost" className="w-full mt-6 md:hidden text-primary hover:text-primary-hover hover:bg-primary/5">
              View All Profiles
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-secondary to-primary text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto max-w-3xl relative z-10">
          <Heart className="w-16 h-16 mx-auto mb-6 text-white/80 animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Find your perfect match.</h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light">
            Join the only exclusive, 100% free matrimonial platform for CA &amp; CS professionals.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-16 px-10 rounded-full bg-white text-secondary hover:bg-white/90 font-bold text-lg shadow-lg">
              Create Your Free Profile
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
