import Link from "next/link";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Terms of Service</h1>
          <p className="text-white/80 text-lg">Last updated: September 2026</p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-lg max-w-none space-y-10">
          
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">1. Introduction & Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">By using JodiBanao, you agree to these Terms of Service. To use our platform, you must be at least 18 years old and be a Chartered Accountant, Company Secretary, or a student pursuing these professions under ICAI or ICSI.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">2. Acceptable Use</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>You must provide accurate and truthful information.</li>
              <li>No fake profiles or impersonation of others.</li>
              <li>You must treat all members with respect and maintain appropriate conduct.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">3. Professional Verification</h2>
            <p className="text-muted-foreground leading-relaxed">Providing a valid ICAI/ICSI membership or registration number is required. Profiles are subject to verification by admins. Misrepresenting your professional status may result in immediate account termination.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">4. Prohibited Activities</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>Harassment, abusive language, or threatening behavior.</li>
              <li>Spam, solicitation, or commercial activities.</li>
              <li>Scraping or harvesting user data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">All content, trademarks, and logos on the platform are the property of JodiBanao. You retain ownership of your personal content (photos, text) but grant us a license to use it to provide the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">JodiBanao is a matchmaking platform. We are not responsible for the real-life conduct of members. We do not guarantee marriage or specific outcomes. Use the service at your own discretion and safety.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">8. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">For legal inquiries or to report violations, please contact: <a href="mailto:legal@jodibanao.com" className="text-primary hover:underline">legal@jodibanao.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border text-center">
          <p className="text-muted-foreground text-sm">Need help? <Link href="/contact" className="text-primary hover:underline font-medium">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
}
