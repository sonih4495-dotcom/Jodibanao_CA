"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { calculateMatchScore } from '@/utils/matchScore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Heart, RefreshCcw, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function DiscoverContent() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    setCurrentUser(userProfile);

    // Fetch sent interests to exclude
    const { data: sent } = await supabase
      .from('interests')
      .select('to_user_id')
      .eq('from_user_id', session.user.id);
    const sentIds = new Set(sent?.map(s => s.to_user_id) || []);

    const { data: incoming } = await supabase
      .from('interests')
      .select('from_user_id')
      .eq('to_user_id', session.user.id);
    const incomingIds = new Set(incoming?.map(i => i.from_user_id) || []);

    let profileQuery = supabase
      .from('profiles')
      .select('*')
      .neq('id', session.user.id);

    const userGender = userProfile?.gender?.toLowerCase()?.trim();
    const targetGender = userGender === 'male' ? 'female' : userGender === 'female' ? 'male' : null;
    if (targetGender) {
      profileQuery = profileQuery.ilike('gender', targetGender);
    }

    const { data: allProfiles } = await profileQuery;

    if (allProfiles && userProfile) {
      const available = allProfiles.filter(p => {
        if (sentIds.has(p.id) || incomingIds.has(p.id)) return false;
        if (targetGender && p.gender && p.gender.toLowerCase().trim() !== targetGender) return false;
        return true;
      });
      const scored = available.map(p => {
        let age = 25;
        if (p.dob) age = new Date().getFullYear() - new Date(p.dob).getFullYear();
        return { ...p, calculatedScore: calculateMatchScore(userProfile, p), age };
      }).sort((a, b) => b.calculatedScore - a.calculatedScore);

      setProfiles(scored);
    }
    setCurrentIndex(0);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, [supabase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (profiles.length === 0 || currentIndex >= profiles.length) return;
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profiles, currentIndex]);

  const handleSwipe = async (dir: 'left' | 'right') => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    if (dir === 'right') {
      const { error } = await supabase.from('interests').insert({
        from_user_id: currentUser.id,
        to_user_id: currentProfile.id,
        status: 'pending'
      });
      if (error) {
        toast.error('Failed to send interest.');
      } else {
        toast.success(`Interest sent to ${currentProfile.first_name}!`);
      }
    } else {
      toast.info('Skipped profile');
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-muted/20 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <RefreshCcw className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-4">You're all caught up!</h2>
          <p className="text-muted-foreground mb-8">You've seen all the matching profiles in your area. Check back later for new members.</p>
          <div className="flex gap-4 w-full">
            <Button onClick={fetchProfiles} variant="outline" className="flex-1">
              Reset Session
            </Button>
            <Link href="/browse" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary-hover">Browse All</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = profiles[currentIndex];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">
            {currentIndex + 1} of {profiles.length} Profiles
          </span>
          <div className="w-10" />
        </div>
        
        <Card className="overflow-hidden shadow-2xl rounded-3xl border-0 bg-white relative animate-in slide-in-from-bottom-8 duration-300">
          <div className="aspect-[3/4] relative bg-gray-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 flex flex-col items-center justify-center">
               <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-sm border-4 border-white/50 flex items-center justify-center text-6xl font-serif font-bold text-white shadow-xl">
                 {profile.first_name?.charAt(0) || "U"}
               </div>
            </div>
            
            <div className="absolute top-4 left-4">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-primary shadow-lg flex items-center gap-1">
                <Heart className="w-4 h-4 fill-primary" /> {profile.calculatedScore}% Match
              </div>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6 pt-24 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-serif font-bold mb-1 flex items-center gap-2">
                    {profile.first_name}, {profile.age}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-sm text-white/90 font-medium">
                    {profile.profession_type && (
                      <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                        {profile.profession_type.toUpperCase()}
                      </span>
                    )}
                    <span>{profile.city || 'Location unknown'}</span>
                  </div>
                </div>
                <Link href={`/profile/${profile.id}`}>
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-10 w-10 bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-sm">
                    <Info className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              {profile.about_me && (
                <p className="mt-4 text-sm text-white/80 line-clamp-2">
                  "{profile.about_me}"
                </p>
              )}
            </div>
          </div>
          
          <div className="p-6 flex justify-center gap-6 bg-white">
            <Button 
              onClick={() => handleSwipe('left')}
              variant="outline" 
              size="icon" 
              className="w-16 h-16 rounded-full border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 shadow-sm"
            >
              <X className="w-8 h-8" />
            </Button>
            <Button 
              onClick={() => handleSwipe('right')}
              size="icon" 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg border-0"
            >
              <Heart className="w-8 h-8 fill-white" />
            </Button>
          </div>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
          Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-border">←</kbd> and <kbd className="bg-white px-1.5 py-0.5 rounded border border-border">→</kbd> arrow keys to swipe
        </p>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <DiscoverContent />
    </Suspense>
  );
}
