"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-background -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-secondary/20 rounded-full blur-3xl opacity-50 -z-10" />

        <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-primary/20">
          #1 Trusted Matchmaking App
        </Badge>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
          Your <span className="text-primary relative inline-block">Perfect<svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/40" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" /></svg></span> Match Awaits
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
          Join thousands of South Asians worldwide who found their soulmates based on shared values, culture, and true compatibility.
        </p>
        
        {/* Quick Search Bar directly in Hero */}
        <div className="w-full max-w-4xl bg-card rounded-2xl shadow-xl p-4 md:p-6 border border-border flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Looking For</label>
            <Select defaultValue="bride">
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 text-lg w-full px-0 font-medium">
                <SelectValue placeholder="Bride / Groom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bride">A Bride</SelectItem>
                <SelectItem value="groom">A Groom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden md:block w-px bg-border my-2" />
          
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Religion / Community</label>
            <Select defaultValue="hindu">
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 text-lg w-full px-0 font-medium">
                <SelectValue placeholder="Select Religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hindu">Hindu</SelectItem>
                <SelectItem value="muslim">Muslim</SelectItem>
                <SelectItem value="sikh">Sikh</SelectItem>
                <SelectItem value="christian">Christian</SelectItem>
                <SelectItem value="jain">Jain</SelectItem>
                <SelectItem value="buddhist">Buddhist</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden md:block w-px bg-border my-2" />
          
          <div className="flex-1 flex gap-2">
            <div className="w-1/2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Age From</label>
              <Input type="number" placeholder="22" defaultValue={24} className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg px-0 font-medium w-full" />
            </div>
            <div className="w-1/2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block text-left">Age To</label>
              <Input type="number" placeholder="32" defaultValue={32} className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg px-0 font-medium w-full" />
            </div>
          </div>
          
          <Link href="/browse" className="w-full md:w-auto">
            <Button size="lg" className="w-full h-16 px-8 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-lg flex gap-2 shadow-sm transition-all hover:shadow-md">
              <Search className="w-5 h-5" />
              Find Matches
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">50,000+</h3>
              <p className="text-sm font-medium text-muted-foreground">Active Profiles</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">10,000+</h3>
              <p className="text-sm font-medium text-muted-foreground">Success Stories</p>
            </div>
            <div className="text-center px-4 border-l-0 md:border-l">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">100%</h3>
              <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-bold font-serif text-secondary mb-2">24/7</h3>
              <p className="text-sm font-medium text-muted-foreground">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-16 text-lg">Your journey to finding the perfect life partner is just three simple steps away.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-border -z-10" />
            
            <div className="flex flex-col items-center bg-card p-8 rounded-2xl shadow-sm border border-border/50 relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 ring-8 ring-background">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3">1. Register</h3>
              <p className="text-muted-foreground text-sm">Create your profile, add details about yourself and state your preferences.</p>
            </div>
            
            <div className="flex flex-col items-center bg-card p-8 rounded-2xl shadow-sm border border-border/50 relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 ring-8 ring-background">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3">2. Browse</h3>
              <p className="text-muted-foreground text-sm">Search through thousands of verified profiles matching your criteria.</p>
            </div>
            
            <div className="flex flex-col items-center bg-card p-8 rounded-2xl shadow-sm border border-border/50 relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 ring-8 ring-background">
                <Heart className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3">3. Connect</h3>
              <p className="text-muted-foreground text-sm">Send interests and start conversing when there is a mutual match.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Profiles (Privacy First) */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">Privacy First</Badge>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">Featured Matches</h2>
              <p className="text-muted-foreground text-lg">Browse recently active profiles. Photos remain blurred until you connect, ensuring your complete privacy and security.</p>
            </div>
            <Button variant="ghost" className="hidden md:flex text-primary hover:text-primary-hover hover:bg-primary/5">
              View All Profiles
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden group border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[4/5] relative bg-muted overflow-hidden">
                  {/* Blurred placeholder representing photo */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${i%2===0 ? 'from-primary/20 to-secondary/20' : 'from-secondary/20 to-primary/20'} backdrop-blur-xl blur-md scale-110 flex items-center justify-center`}>
                    <ShieldCheck className="w-16 h-16 text-foreground/20 opacity-50" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
                    <h3 className="text-white font-serif font-bold text-xl mb-1">Priya, {26 + i}</h3>
                    <p className="text-white/80 text-sm">Software Engineer • Mumbai</p>
                  </div>
                </div>
                <CardContent className="p-4 grid grid-cols-2 gap-y-2 text-sm text-muted-foreground bg-card">
                  <div><span className="font-semibold text-foreground text-xs uppercase opacity-70">Religion</span><p>Hindu</p></div>
                  <div><span className="font-semibold text-foreground text-xs uppercase opacity-70">Height</span><p>5&apos;4&quot;</p></div>
                  <div className="col-span-2 pt-3 mt-1 border-t border-border">
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary-hover font-semibold">
                      Send Interest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-6 md:hidden text-primary hover:text-primary-hover hover:bg-primary/5">
            View All Profiles
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-secondary to-primary text-white text-center px-4 relative overflow-hidden">
        {/* Decorative background mandala/floral subtle pattern hint */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto max-w-3xl relative z-10">
          <Heart className="w-16 h-16 mx-auto mb-6 text-white/80 animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Ready to start your forever?</h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light">
            Join Jodibanao today and take the first step towards a lifetime of happiness.
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
