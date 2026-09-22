import Link from "next/link";
import { Heart, Briefcase, IndianRupee, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Heart className="w-16 h-16 mx-auto mb-6 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">About JodiBanao</h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto">
            The exclusive matrimonial platform dedicated to finding life partners within the CA & CS community.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe that shared professional backgrounds, mutual understanding of career demands, and similar ambitions create a strong foundation for a lifelong partnership. JodiBanao was built to bridge the gap and bring Chartered Accountants and Company Secretaries closer together.
          </p>
        </div>
      </section>

      {/* Why CA/CS */}
      <section className="py-16 bg-muted/30 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-serif font-bold text-center text-foreground mb-12">Why Choose JodiBanao?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
              <Briefcase className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-serif font-bold mb-3">Shared Work Culture</h3>
              <p className="text-muted-foreground">Partners who understand the long hours, tax seasons, and board meetings. No more explaining why you're working late on a weekend.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
              <Heart className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-serif font-bold mb-3">Professional Understanding</h3>
              <p className="text-muted-foreground">A deeper connection rooted in similar educational journeys, struggles of clearing exams, and professional ambitions.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
              <IndianRupee className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-serif font-bold mb-3">Income Compatibility</h3>
              <p className="text-muted-foreground">Find partners with matching financial goals, stability, and lifestyle expectations tailored to high-achieving professionals.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
              <ShieldCheck className="w-10 h-10 text-success mb-4" />
              <h3 className="text-xl font-serif font-bold mb-3">Verified Credentials</h3>
              <p className="text-muted-foreground">Every profile is encouraged to verify their ICAI/ICSI membership, creating a trusted and secure environment for everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Story */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-16">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Our Commitment to Trust</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We prioritize your privacy and security above all else. With features like photo privacy controls, professional verification badges, and strict moderation, JodiBanao ensures a safe space for your matrimonial search.
            </p>
          </div>

          <div className="bg-primary/5 p-8 md:p-12 rounded-3xl border border-primary/10 text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">How We Started</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              JodiBanao was born out of a simple observation: CA and CS professionals often prefer partners from the same fraternity due to the unique demands of their careers, but general matrimonial sites made it difficult to filter and find verified professionals. We created JodiBanao to solve this exact problem — a niche, premium, and trustworthy community.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary-hover text-white rounded-full px-8">
                Join the Community
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
