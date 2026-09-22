import Link from "next/link";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/80 text-lg">Last updated: September 2026</p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-lg max-w-none space-y-10">
          
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">JodiBanao ("we", "our", "the platform") is a matrimonial service exclusively for Chartered Accountants (CA), Company Secretaries (CS), and students pursuing these professions under ICAI and ICSI. We are committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (India DPDP Act) and applicable regulations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">2. Information We Collect</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account Information:</strong> Name, email, mobile number, date of birth, gender</li>
              <li><strong className="text-foreground">Professional Information:</strong> CA/CS designation, ICAI/ICSI membership number, firm/company name</li>
              <li><strong className="text-foreground">Profile Information:</strong> Religion, city, education, income range, lifestyle preferences, about me, partner preferences</li>
              <li><strong className="text-foreground">Photos:</strong> Profile photos uploaded by you — stored securely in encrypted cloud storage</li>
              <li><strong className="text-foreground">Communications:</strong> Messages exchanged between users on the platform</li>
              <li><strong className="text-foreground">Usage Data:</strong> Profile views, interest history, login timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">3. How We Use Your Information</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>To provide and operate the matrimonial matching service</li>
              <li>To verify your CA/CS professional credentials</li>
              <li>To show your profile to other registered members (subject to your privacy settings)</li>
              <li>To send match recommendations, interest notifications, and system alerts</li>
              <li>To ensure platform safety and moderate reported content</li>
              <li>To improve our matching algorithm and service quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">4. Photo Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">You control who sees your profile photo. Options: (a) Everyone on the platform, (b) Only mutual matches, (c) Only verified professionals. Photos are stored with access controls and are not shared with third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">We do not sell your personal data to any third party. Your profile is visible only to other registered members of JodiBanao. We may share data with service providers (e.g., cloud storage, email delivery) strictly for platform operations under data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">6. Your Rights (DPDP Act 2023)</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-foreground">Right to Correction:</strong> Update inaccurate data via your profile settings</li>
              <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your account and all associated data</li>
              <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Deactivate your profile at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">Active profiles are retained as long as your account is active. On account deletion request, all personal data is permanently deleted within 30 days. Messages are deleted immediately upon account deletion.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">We implement industry-standard security measures: encrypted storage, secure HTTPS transmission, Row-Level Security on our database, and access controls on all stored media. Passwords are never stored in plain text.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">9. Contact & Data Requests</h2>
            <p className="text-muted-foreground leading-relaxed">For any privacy-related requests, data deletion, or concerns, contact us at: <a href="mailto:privacy@jodibanao.com" className="text-primary hover:underline">privacy@jodibanao.com</a>. We respond within 72 hours.</p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border text-center">
          <p className="text-muted-foreground text-sm">Questions? <Link href="/contact" className="text-primary hover:underline font-medium">Contact us</Link> or email <a href="mailto:privacy@jodibanao.com" className="text-primary hover:underline">privacy@jodibanao.com</a></p>
        </div>
      </div>
    </div>
  );
}
