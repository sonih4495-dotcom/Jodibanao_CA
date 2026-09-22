"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ShieldCheck, Heart, MessageCircle, Star, Ban, Copy, MapPin, GraduationCap, Briefcase, HeartHandshake, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use() to unwrap params in Next.js 15+ App Router
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;
  
  const [interestSent, setInterestSent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMutualMatch, setIsMutualMatch] = useState(profileId === "1001" || profileId === "1005"); // Mock mutual matching
  const [photosRevealed, setPhotosRevealed] = useState(isMutualMatch);

  const reqPhotoUnlock = () => {
    alert("Request to reveal photos sent. Users must accept your interest before photos are revealed.");
  };

  return (
    <div className="bg-muted/20 min-h-[calc(100vh-80px)] py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Mutual Match Banner */}
        {isMutualMatch && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-green-800 font-bold font-serif text-lg">It&apos;s a Mutual Match!</h3>
                <p className="text-green-700 text-sm">You both have liked each other. Photos are now unlocked.</p>
              </div>
            </div>
            <Button className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-sm leading-tight flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat Now
            </Button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Photos & Quick Stats */}
          <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-6">
            
            {/* Main Photo Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border group relative">
              <div className="aspect-[4/5] relative bg-muted flex items-center justify-center overflow-hidden">
                {!photosRevealed ? (
                  <div className="absolute inset-0 z-0 bg-gradient-to-tr from-primary/30 to-secondary/30 backdrop-blur-3xl blur-md flex flex-col items-center justify-center p-6 text-center">
                    <ShieldCheck className="w-20 h-20 text-foreground/20 opacity-60 mb-4" />
                    <p className="text-lg font-serif font-bold text-foreground/80 mb-2">Photos Hidden</p>
                    <p className="text-sm text-muted-foreground">For privacy, photos are only revealed to mutual matches.</p>
                    <Button variant="outline" size="sm" className="mt-6 border-primary/30 text-primary hover:bg-primary/5 shadow-sm" onClick={reqPhotoUnlock}>
                      Request Access
                    </Button>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                     <span className="text-muted-foreground">User Photo Unlocked</span>
                  </div>
                )}
                
                <Badge className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md shadow-sm">
                  1/4 Photos
                </Badge>
                
                {isMutualMatch && (
                  <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white opacity-100" />
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions (Desktop Sidebar) */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 hidden lg:block">
              <h3 className="font-serif font-bold text-xl mb-4 text-foreground">Connect</h3>
              <div className="flex flex-col gap-3">
                {!isMutualMatch ? (
                  <Button 
                    variant={interestSent ? "outline" : "default"}
                    className={`w-full py-6 font-semibold shadow-sm transition-all ${interestSent ? "border-green-600 text-green-700 hover:bg-green-50" : "bg-primary hover:bg-primary-hover text-white"}`}
                    onClick={() => setInterestSent(true)}
                  >
                    {interestSent ? <span className="flex items-center gap-2"><Heart className="w-5 h-5 fill-green-600 text-green-600" /> Interest Sent</span> : <span className="flex items-center gap-2"><Heart className="w-5 h-5" /> Send Interest</span>}
                  </Button>
                ) : (
                  <Button className="w-full py-6 font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> Start Chat
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className={`w-full py-6 font-semibold transition-colors ${isSaved ? "border-amber-500 text-amber-600 hover:bg-amber-50" : "border-border text-foreground hover:bg-muted"}`}
                  onClick={() => setIsSaved(!isSaved)}
                >
                  {isSaved ? <span className="flex items-center gap-2"><Star className="w-5 h-5 fill-amber-500 text-amber-500" /> Profile Saved</span> : <span className="flex items-center gap-2"><Star className="w-5 h-5" /> Save Profile</span>}
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Safety Controls */}
              <div className="flex flex-col gap-2">
                <Dialog>
                  <DialogTrigger className="w-full text-left">
                    <span className="w-full flex justify-start text-muted-foreground hover:bg-destructive/10 text-sm font-medium hover:text-destructive transition-colors px-3 py-2 h-auto items-center gap-3">
                      <Ban className="w-4 h-4 shrink-0" /> Block User
                    </span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block Profile</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to block this user? They will not be able to see your profile or contact you.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive">Block User</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger className="w-full text-left">
                    <span className="w-full flex justify-start text-muted-foreground hover:bg-amber-500/10 text-sm font-medium hover:text-amber-600 transition-colors px-3 py-2 h-auto items-center gap-3">
                      <ShieldAlert className="w-4 h-4 shrink-0" /> Report Profile
                    </span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Profile</DialogTitle>
                      <DialogDescription>
                        Please let us know why you are reporting this user.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fake">Fake Profile</SelectItem>
                          <SelectItem value="spam">Spam / Scam</SelectItem>
                          <SelectItem value="abusive">Abusive Content</SelectItem>
                          <SelectItem value="married">Already Married</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end gap-3 mt-2">
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive">Submit Report</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Content */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Header Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
                    Priya Sharma, 28
                    <span aria-label="Verified Profile"><ShieldCheck className="w-6 h-6 text-green-500 hidden sm:block" /></span>
                  </h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
                    Profile ID: JB-{profileId} <Copy className="w-3 h-3 ml-1 cursor-pointer hover:text-primary transition-colors" />
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-medium">Premium Member</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Active 2 hrs ago</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-lg border border-border/50">
                  <Briefcase className="w-5 h-5 text-primary opacity-80" />
                  <span className="text-sm font-medium">Software Engineer</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-lg border border-border/50">
                  <GraduationCap className="w-5 h-5 text-primary opacity-80" />
                  <span className="text-sm font-medium">M.Tech (Computer Science)</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-lg border border-border/50">
                  <MapPin className="w-5 h-5 text-primary opacity-80" />
                  <span className="text-sm font-medium">Mumbai, India</span>
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="text-2xl font-serif font-bold text-foreground border-b border-border pb-4 mb-6 relative">
                <span className="relative z-10 bg-white pr-4">About Me</span>
                <div className="absolute left-0 bottom-[-1px] w-20 h-[3px] bg-primary"></div>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                I am a very simple, caring, talented, understanding, trustworthy and kind hearted human being. I believe in the motto &quot;Live and let live&quot;. I hate liars. I am fun loving, down to earth and very much Optimist. I love travelling, sight seeing, listening to rock music, reading all the latest fiction novels.
                <br/><br/>
                Professionally, I am working as a Software Engineer at a leading MNC in Mumbai. My career is important to me, but I believe in maintaining a healthy work-life balance. I respect elders and family values while holding a modern outlook on life.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
                <h2 className="text-xl font-serif font-bold text-foreground border-b border-border pb-4 mb-6">Personal Details</h2>
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Religion</span>
                    <span className="font-semibold text-foreground text-right">Hindu</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Caste</span>
                    <span className="font-semibold text-foreground text-right">Brahmin</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Mother Tongue</span>
                    <span className="font-semibold text-foreground text-right">Hindi</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Height</span>
                    <span className="font-semibold text-foreground text-right">5&apos;4&quot; (162 cm)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Marital Status</span>
                    <span className="font-semibold text-foreground text-right">Never Married</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Diet</span>
                    <span className="font-semibold text-foreground text-right">Vegetarian</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Smoke / Drink</span>
                    <span className="font-semibold text-foreground text-right">No / No</span>
                  </div>
                </div>
              </div>

              {/* Family Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
                <h2 className="text-xl font-serif font-bold text-foreground border-b border-border pb-4 mb-6">Family Details</h2>
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Family Type</span>
                    <span className="font-semibold text-foreground text-right">Nuclear</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Family Values</span>
                    <span className="font-semibold text-foreground text-right">Moderate</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Father&apos;s Status</span>
                    <span className="font-semibold text-foreground text-right">Retired (Govt. Service)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Mother&apos;s Status</span>
                    <span className="font-semibold text-foreground text-right">Homemaker</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Brothers</span>
                    <span className="font-semibold text-foreground text-right">1 (Married)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/30 border-dashed">
                    <span className="text-muted-foreground">Sisters</span>
                    <span className="font-semibold text-foreground text-right">None</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="text-2xl font-serif font-bold text-foreground border-b border-border pb-4 mb-6 relative">
                <span className="relative z-10 bg-white pr-4">Partner Preferences</span>
                <div className="absolute left-0 bottom-[-1px] w-24 h-[3px] bg-primary"></div>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 text-sm">
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Age Range</span>
                  <span className="font-medium text-[15px]">28 to 33 Years</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Height Range</span>
                  <span className="font-medium text-[15px]">5&apos;8&quot; to 6&apos;2&quot;</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Marital Status</span>
                  <span className="font-medium text-[15px]">Never Married</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Core Religion</span>
                  <span className="font-medium text-[15px]">Hindu</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Caste Preference</span>
                  <span className="font-medium text-[15px]">Preferably Brahmin, but open minded</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Education</span>
                  <span className="font-medium text-[15px]">Masters / Doctorate</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Location Preference</span>
                  <span className="font-medium text-[15px]">Mumbai, Pune, NRI</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-xs font-semibold block mb-1">Diet Preference</span>
                  <span className="font-medium text-[15px]">Vegetarian</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Action Bar (Sticky Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] lg:hidden flex gap-3 z-50">
          {!isMutualMatch ? (
            <Button 
              className={`flex-1 font-semibold shadow-sm h-12 ${interestSent ? "border-green-600 border bg-green-50 text-green-700" : "bg-primary text-white"}`}
              onClick={() => setInterestSent(true)}
            >
              {interestSent ? "Interest Sent" : "Send Interest"}
            </Button>
          ) : (
            <Button className="flex-1 bg-green-600 text-white font-semibold h-12 shadow-sm">
              Start Chat
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            className={`w-12 h-12 shrink-0 border-border ${isSaved ? "border-amber-500 bg-amber-50" : ""}`}
            onClick={() => setIsSaved(!isSaved)}
          >
            <Star className={`w-5 h-5 ${isSaved ? "fill-amber-500 text-amber-500" : "text-foreground"}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
