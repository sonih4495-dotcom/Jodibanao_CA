"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Enquiry");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('contact_requests').insert([
        { name, email, subject, message }
      ]);
      
      if (error) throw error;
      
      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Contact Us</h1>
          <p className="text-white/80 text-lg">We're here to help you on your journey</p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="grid md:grid-cols-5 gap-12">
          
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">Get in Touch</h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you have a question about verification, need help with your profile, or want to report an issue, our team is ready to assist you.
              </p>
            </div>
            
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <Mail className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-1">Email Us</h3>
              <a href="mailto:contact@jodibanao.com" className="text-primary hover:underline font-medium">contact@jodibanao.com</a>
              <p className="text-sm text-muted-foreground mt-2">We respond within 48 hours.</p>
            </div>
          </div>

          <div className="md:col-span-3">
            <Card className="border-border shadow-md">
              <CardContent className="p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">Thank you for reaching out. We've received your message and will get back to you shortly.</p>
                    <Button onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }} variant="outline">
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <select 
                        id="subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="General Enquiry">General Enquiry</option>
                        <option value="Verification Help">Verification Help</option>
                        <option value="Report an Issue">Report an Issue</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea 
                        id="message" 
                        rows={5} 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        required 
                        className="bg-white resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-6" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
