"use client";

import { useEffect, useState } from "react";
import { Check, X, Diamond, Crown, ShieldCheck, Star, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

declare global {
  interface Window { Razorpay: any; }
}

const PLANS = [
  {
    id: "free",
    name: "Basic",
    price: "₹0",
    period: "forever",
    icon: ShieldCheck,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    checkColor: "text-green-500",
    features: [
      { label: "Create profile", included: true },
      { label: "Browse profiles", included: true },
      { label: "Receive interests", included: true },
      { label: "Send interests", included: false },
      { label: "View contact numbers", included: false },
      { label: "Chat (unlocked on Mutual)", included: false },
    ],
    buttonLabel: "Current Plan",
    buttonClass: "border-border text-foreground",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    id: "silver",
    name: "Silver",
    price: "₹2,499",
    period: "3 months",
    icon: Diamond,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    checkColor: "text-primary",
    features: [
      { label: "Everything in Basic", included: true },
      { label: "Send unlimited interests", included: true },
      { label: "View 50 contact numbers / month", included: true },
      { label: "Chat instantly with matches", included: true },
      { label: "Priority Profile Listing", included: false },
      { label: "Dedicated Relationship Manager", included: false },
    ],
    buttonLabel: "Choose Silver",
    buttonClass: "bg-primary hover:bg-primary-hover text-white",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    id: "gold",
    name: "Gold",
    price: "₹4,999",
    period: "6 months",
    icon: Crown,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    checkColor: "text-amber-500",
    features: [
      { label: "Everything in Silver", included: true },
      { label: "Unlimited contact numbers", included: true },
      { label: "Priority Profile Listing (Top)", included: true },
      { label: "Gold Member badge", included: true },
      { label: "Dedicated Relationship Manager", included: true },
      { label: "Profile Boost 2x/week", included: true },
    ],
    buttonLabel: "Choose Gold",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
    buttonVariant: "default" as const,
    popular: false,
  },
];

export default function MembershipPage() {
  const supabase = createClient();
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Fetch current membership
    const loadMembership = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membership) {
        setCurrentPlan(membership.plan || "free");
        if (membership.end_date) {
          setPlanExpiry(new Date(membership.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
        }
      }
    };

    loadMembership();
  }, []);

  const handlePayment = async (plan: typeof PLANS[0]) => {
    if (plan.id === "free") return;
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setLoadingPlan(plan.id);

    try {
      // 1. Create Razorpay order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, userId }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const { orderId, amount, keyId } = await res.json();

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency: "INR",
        name: "Jodibanao",
        description: `${plan.name} Plan - ${plan.period}`,
        order_id: orderId,
        handler: async (response: any) => {
          // 3. Verify payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
              userId,
              amount,
            }),
          });

          if (verifyRes.ok) {
            setCurrentPlan(plan.id);
            alert(`🎉 Your ${plan.name} membership has been activated!`);
            window.location.reload();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {},
        theme: { color: "#C2185B" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert("Unable to initiate payment: " + error.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">


      <div className="py-16 px-4 flex flex-col items-center flex-1">
        <div className="text-center max-w-2xl mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5 px-4 py-1 text-sm font-semibold uppercase tracking-widest inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Premium Membership
          </Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            Invest in your{" "}
            <span className="text-primary relative inline-block">
              Future
              <svg className="absolute w-full h-2 -bottom-0 left-0 text-primary/40" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Upgrade to connect with matching profiles instantly.
          </p>

          {currentPlan !== "free" && planExpiry && (
            <div className="mt-6 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Star className="w-4 h-4 fill-primary" />
              Active {PLANS.find(p => p.id === currentPlan)?.name} Plan — Expires {planExpiry}
            </div>
          )}
        </div>

        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id;
              const Icon = plan.icon;

              return (
                <Card
                  key={plan.id}
                  className={`h-full flex flex-col transition-all duration-300 ${
                    plan.popular
                      ? "border-primary shadow-xl lg:scale-105 relative"
                      : "border-border shadow-sm hover:shadow-md"
                  } bg-white`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Most Popular
                    </div>
                  )}

                  <CardHeader className={`text-center pb-6 border-b border-border/50 ${plan.popular ? "bg-primary/5 rounded-t-xl" : ""}`}>
                    <div className={`mx-auto w-12 h-12 ${plan.iconBg} rounded-full flex items-center justify-center mb-2 ${plan.id === "free" ? "" : "mt-4"}`}>
                      <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                    </div>
                    <CardTitle className={`text-2xl font-serif mb-1 ${plan.popular ? "text-primary" : "text-foreground"}`}>{plan.name}</CardTitle>
                    <div className="mt-4 flex items-end justify-center font-bold text-foreground">
                      <span className={`text-4xl ${plan.popular ? "text-5xl" : ""}`}>{plan.price}</span>
                      <span className="text-muted-foreground text-sm font-normal mb-2 ml-1">/ {plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-6">
                    <ul className="space-y-3.5">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className={`flex items-start gap-3 text-sm ${!f.included ? "opacity-40" : ""}`}>
                          {f.included
                            ? <Check className={`w-4 h-4 ${plan.checkColor} shrink-0 mt-0.5`} />
                            : <X className="w-4 h-4 shrink-0 mt-0.5" />
                          }
                          <span className={f.included ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-2">
                    <Button
                      disabled={isCurrentPlan || loadingPlan !== null}
                      onClick={() => handlePayment(plan)}
                      variant={plan.buttonVariant}
                      className={`w-full py-6 font-semibold text-base transition-transform hover:-translate-y-0.5 ${isCurrentPlan ? "opacity-50 pointer-events-none" : ""} ${plan.buttonClass}`}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isCurrentPlan ? (
                        "Current Plan ✓"
                      ) : (
                        plan.buttonLabel
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12 text-muted-foreground text-sm">
            <p>🔒 Payments secured by Razorpay. We accept UPI, Cards, and Netbanking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
