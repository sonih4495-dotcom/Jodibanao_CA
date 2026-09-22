"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Loader2, Send, CheckCircle2, ImageIcon } from "lucide-react";

export default function SuccessStoriesPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    couple_names: "",
    wedding_date: "",
    city: "",
    religion: "",
    story: "",
    photo_url: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data } = await supabase
        .from("success_stories")
        .select("*")
        .eq("is_approved", true)
        .order("submitted_at", { ascending: false });

      if (data) setStories(data);
      setLoading(false);
    };
    init();
  }, []);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    const path = `success-stories/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      update("photo_url", publicUrl);
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async () => {
    if (!form.couple_names || !form.story) return;
    setSubmitting(true);

    await supabase.from("success_stories").insert({
      ...form,
      user1_id: user?.id || null,
      wedding_date: form.wedding_date || null,
    });

    setSubmitted(true);
    setSubmitting(false);
    setShowForm(false);
  };

  const PLACEHOLDER_STORIES = [
    { id: "1", couple_names: "Rahul & Priya", city: "Mumbai", religion: "hindu", wedding_date: "2024-02-14", story: "We matched on Jodibanao based on our shared love for mountains and our similar Gujarati backgrounds. After six months of getting to know each other, Rahul proposed at the top of a hill station. We got married in February 2024 and couldn't be happier!", photo_url: "" },
    { id: "2", couple_names: "Arjun & Meera", city: "Pune", religion: "brahmin", wedding_date: "2023-11-20", story: "Both of us were a bit skeptical about online matrimony, but Jodibanao's match score system showed us a 91% compatibility. After speaking for four months, we knew this was something special. Married in November 2023 with both families overjoyed.", photo_url: "" },
    { id: "3", couple_names: "Vikram & Anjali", city: "Hyderabad", religion: "hindu", wedding_date: "2024-06-01", story: "Our families had been looking for the right match for years. When we connected through Jodibanao, everything just clicked — similar values, education levels, and family backgrounds. We're now happily married and expecting our first child.", photo_url: "" },
  ];

  const displayStories = stories.length > 0 ? stories : PLACEHOLDER_STORIES;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">


      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-20 px-4 text-center border-b border-border">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
          ❤️ Love Stories
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
          Where Families <span className="text-primary">Come Together</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Real couples who found their forever on Jodibanao. Their joy is our mission.
        </p>
        {user && !showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-base font-semibold shadow-md"
          >
            Share Your Story ✍️
          </Button>
        )}
        {!user && (
          <Button onClick={() => router.push("/login")} className="bg-primary text-white px-8 py-6 text-base font-semibold">
            Login to Share Your Story
          </Button>
        )}
      </section>

      {/* Submit Form */}
      {showForm && !submitted && (
        <section className="container mx-auto max-w-2xl px-4 py-10">
          <Card className="border-border shadow-lg bg-white">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="font-serif text-2xl text-primary">Share Your Love Story ❤️</CardTitle>
              <p className="text-muted-foreground text-sm">Your story will be reviewed and published to inspire others.</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Couple Names *</Label>
                <Input value={form.couple_names} onChange={e => update("couple_names", e.target.value)} placeholder="e.g. Rahul & Priya" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Wedding Date</Label>
                  <Input type="date" value={form.wedding_date} onChange={e => update("wedding_date", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">City</Label>
                  <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Mumbai" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Your Story *</Label>
                <Textarea 
                  value={form.story} 
                  onChange={e => update("story", e.target.value)} 
                  placeholder="How did you meet? What made you choose each other? Tell us everything!" 
                  rows={6} 
                  className="resize-none"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Couple Photo (Optional)</Label>
                {form.photo_url ? (
                  <div className="relative">
                    <img src={form.photo_url} className="w-full h-48 object-cover rounded-xl" alt="Couple" />
                    <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => update("photo_url", "")}>Remove</Button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingPhoto}
                    className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                    <span className="text-sm">{uploadingPhoto ? "Uploading..." : "Click to upload photo"}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!form.couple_names || !form.story || submitting}
                  className="flex-1 bg-primary text-white hover:bg-primary-hover gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {submitted && (
        <div className="container mx-auto max-w-lg px-4 py-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Story Submitted! 🎉</h2>
          <p className="text-muted-foreground">Our team will review and publish your story shortly. Thank you for sharing your happiness!</p>
        </div>
      )}

      {/* Stories Grid */}
      <section className="container mx-auto max-w-7xl px-4 py-14">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-serif font-bold text-foreground">{displayStories.length}+ Couples Found Love</h2>
              <p className="text-muted-foreground mt-2">Join thousands of happy families that started here.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayStories.map((story) => (
                <Card key={story.id} className="border-border shadow-sm bg-white hover:shadow-md transition-shadow overflow-hidden">
                  {story.photo_url ? (
                    <div className="h-52 overflow-hidden">
                      <img src={story.photo_url} alt={story.couple_names} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-6xl">💑</span>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-serif font-bold text-xl text-foreground mb-1">{story.couple_names}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {story.city && <span>📍 {story.city}</span>}
                      {story.wedding_date && <span>💍 {new Date(story.wedding_date).getFullYear()}</span>}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">{story.story}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
