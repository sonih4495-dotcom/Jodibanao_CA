"use client";

import Link from "next/link";
import { Check, Heart, ShieldCheck, Video, MessageCircle, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MembershipPage() {
  const features = [
    { label: "Create & browse profiles", icon: Users },
    { label: "Send unlimited interests", icon: Heart },
    { label: "Real-time messaging (mutual matches)", icon: MessageCircle },
    { label: "Voice & video calls", icon: Video },
    { label: "Photo sharing", icon: Star },
    { label: "CA/CS verification badge", icon: ShieldCheck },
    { label: "Advanced search & filters", icon: Users },
    { label: "Success stories", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="py-20 px-4 flex flex-col items-center flex-1">
        <div className="text-center max-w-3xl mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary rounded-full mb-6">
            <Heart className="w-10 h-10 fill-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
            JodiBanao is{" "}
            <span className="text-primary relative inline-block">
              100% Free
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/40" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            Forever
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            We believe finding your life partner within the CA & CS community shouldn't come with a price tag. No premium tiers, no hidden fees, no gating — just genuine connections.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary-hover text-white rounded-full px-10 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              Create Your Free Profile
            </Button>
          </Link>
        </div>

        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border shadow-sm rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl font-serif font-bold text-center mb-10">Everything you need, included for everyone</h2>
            <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{feature.label}</span>
                    <Check className="w-5 h-5 text-success ml-auto shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground italic font-serif text-lg">
              "Building a trusted community for Chartered Accountants and Company Secretaries."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
