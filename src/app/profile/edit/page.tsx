"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { Camera, Loader2, Save, CheckCircle2, User, AlertCircle, GraduationCap, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const highlightMissing = searchParams.get("highlight") === "missing";
  const coreFields = ['avatar_url', 'about_me', 'education', 'profession', 'income', 'city', 'diet', 'smoking', 'drinking'];


  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    religion: "",
    caste: "",
    mother_tongue: "",
    city: "",
    education: "",
    profession: "",
    income: "",
    about_me: "",
    diet: "",
    smoking: "",
    drinking: "",
    family_type: "",
    father_occupation: "",
    mother_occupation: "",
    siblings: "",
    pref_min_age: "",
    pref_max_age: "",
    pref_religion: "",
    pref_location: "",
    avatar_url: "",
    // New CA/CS fields
    profession_type: "",
    membership_number: "",
    photo_visibility: "everyone",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        setForm({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          dob: profile.dob || "",
          gender: profile.gender || "",
          religion: profile.religion || "",
          caste: profile.caste || "",
          mother_tongue: profile.mother_tongue || "",
          city: profile.city || "",
          education: profile.education || "",
          profession: profile.profession || "",
          income: profile.income || "",
          about_me: profile.about_me || "",
          diet: profile.diet || "",
          smoking: profile.smoking || "",
          drinking: profile.drinking || "",
          family_type: profile.family_type || "",
          father_occupation: profile.father_occupation || "",
          mother_occupation: profile.mother_occupation || "",
          siblings: profile.siblings?.toString() || "",
          pref_min_age: profile.pref_min_age?.toString() || "22",
          pref_max_age: profile.pref_max_age?.toString() || "40",
          pref_religion: profile.pref_religion || "",
          pref_location: profile.pref_location || "",
          avatar_url: profile.avatar_url || "",
          // New CA/CS fields
          profession_type: profile.profession_type || "",
          membership_number: profile.membership_number || "",
          photo_visibility: profile.photo_visibility || "everyone",
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast.error("Photo upload failed: " + uploadErr.message);
      setUploadingPhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    update("avatar_url", publicUrl);
    toast.success("Photo uploaded successfully!");

    // Save to profile immediately
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").update({
      ...form,
      siblings: form.siblings ? parseInt(form.siblings) : null,
      pref_min_age: form.pref_min_age ? parseInt(form.pref_min_age) : null,
      pref_max_age: form.pref_max_age ? parseInt(form.pref_max_age) : null,
    }).eq("id", userId);

    if (error) {
      toast.error("Failed to save profile. Please try again.");
    } else {
      setSaved(true);
      toast.success("Profile saved successfully!");
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="border-border shadow-sm bg-white">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-lg font-serif text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {children}
      </CardContent>
    </Card>
  );

  const Field = ({ label, children, full, fieldName }: { label: string; children: React.ReactNode; full?: boolean, fieldName?: string }) => {
    const isMissing = highlightMissing && fieldName && coreFields.includes(fieldName) && !form[fieldName as keyof typeof form];
    
    return (
      <div className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""} ${isMissing ? "p-3 rounded-xl bg-orange-500/10 border border-orange-500/30" : ""}`}>
        <Label className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${isMissing ? "text-orange-600" : "text-muted-foreground"}`}>
          {label} {isMissing && <AlertCircle className="w-3.5 h-3.5" />}
        </Label>
        {children}
      </div>
    );
  };

  const Sel = ({ field, placeholder, options }: { field: string; placeholder: string; options: string[] }) => {
    const isMissing = highlightMissing && coreFields.includes(field) && !form[field as keyof typeof form];
    return (
      <Select value={form[field as keyof typeof form]} onValueChange={(v: string | null) => update(field, v ?? "")}>
        <SelectTrigger className={`h-10 bg-muted/30 ${isMissing ? "border-orange-500/50 ring-1 ring-orange-500/20" : ""}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">

      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Edit Profile</h1>
            <p className="text-muted-foreground mt-1">Keep your profile up-to-date to get better matches.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className={`h-11 px-6 gap-2 shadow-md transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary-hover"} text-white`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>

        {/* Avatar Upload */}
        <Card className="border-border shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full border-4 border-primary/20 bg-primary/10 overflow-hidden flex items-center justify-center">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary/40" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors border-2 border-white"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg mb-1">{form.first_name || "Your Name"}</h3>
              <p className="text-muted-foreground text-sm mb-3">Upload a clear face photo. Only accepted matches can view it.</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs">
                Change Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CA/CS Professional Info */}
        <Card className="border-secondary/30 shadow-sm bg-white">
          <CardHeader className="border-b border-border/60 pb-4 bg-secondary/5">
            <CardTitle className="text-lg font-serif text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-secondary" />
              CA/CS Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Field label="I am a *" fieldName="profession_type">
              <Select value={form.profession_type} onValueChange={(v: string | null) => update("profession_type", v ?? "")}>
                <SelectTrigger className="h-10 bg-muted/30">
                  <SelectValue placeholder="Select CA/CS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">CA — Chartered Accountant</SelectItem>
                  <SelectItem value="CA Student">CA Student (ICAI)</SelectItem>
                  <SelectItem value="CS">CS — Company Secretary</SelectItem>
                  <SelectItem value="CS Student">CS Student (ICSI)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Membership / Student ID *" fieldName="membership_number">
              <Input
                value={form.membership_number}
                onChange={e => update("membership_number", e.target.value)}
                placeholder="e.g. 123456 or STU/XXXX/2024"
                className="h-10 bg-muted/30"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Photo Privacy Settings */}
        <Card className="border-border shadow-sm bg-white">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-serif text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Photo Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Who can see your profile photo?</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: "everyone", label: "Everyone", desc: "All logged-in users", icon: "🌐" },
                  { value: "mutual", label: "Mutual Matches", desc: "Only accepted interests", icon: "❤️" },
                  { value: "verified_only", label: "Verified Only", desc: "Only verified professionals", icon: "✅" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("photo_visibility", opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.photo_visibility === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl block mb-1">{opt.icon}</span>
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Details */}
        <Section title="👤 Basic Details">
          <Field label="First Name">
            <Input value={form.first_name} onChange={e => update("first_name", e.target.value)} placeholder="Enter first name" />
          </Field>
          <Field label="Last Name">
            <Input value={form.last_name} onChange={e => update("last_name", e.target.value)} placeholder="Enter last name" />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.dob} onChange={e => update("dob", e.target.value)} />
          </Field>
          <Field label="Gender">
            <Sel field="gender" placeholder="Select Gender" options={["Male", "Female"]} />
          </Field>
          <Field label="Religion">
            <Sel field="religion" placeholder="Select Religion" options={["Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist", "Other"]} />
          </Field>
          <Field label="Caste">
            <Input value={form.caste} onChange={e => update("caste", e.target.value)} placeholder="e.g. Brahmin, Maratha" />
          </Field>
          <Field label="Mother Tongue">
            <Sel field="mother_tongue" placeholder="Select Language" options={["Hindi", "Gujarati", "Marathi", "Tamil", "Telugu", "Punjabi", "Bengali", "Kannada", "Malayalam", "Other"]} />
          </Field>
          <Field label="Current City" fieldName="city">
            <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Mumbai, London (NRI)" className={highlightMissing && !form.city ? "border-orange-500/50 ring-1 ring-orange-500/20 bg-orange-50/50" : ""} />
          </Field>
        </Section>

        {/* Education & Career */}
        <Section title="🎓 Education & Career">
          <Field label="Education" fieldName="education">
            <Sel field="education" placeholder="Highest Qualification" options={["Doctorate / PhD", "Masters / M.Tech / MBA", "Bachelors / B.Tech", "Diploma", "Higher Secondary", "Other"]} />
          </Field>
          <Field label="Profession" fieldName="profession">
            <Input value={form.profession} onChange={e => update("profession", e.target.value)} placeholder="e.g. Software Engineer, Doctor" className={highlightMissing && !form.profession ? "border-orange-500/50 ring-1 ring-orange-500/20 bg-orange-50/50" : ""} />
          </Field>
          <Field label="Annual Income" fieldName="income">
            <Sel field="income" placeholder="Select Income Range" options={["Below ₹2L", "₹2–5L", "₹5–10L", "₹10–25L", "₹25–50L", "₹50L+", "Prefer not to say"]} />
          </Field>
        </Section>

        {/* Lifestyle */}
        <Section title="🌿 Lifestyle">
          <Field label="Diet" fieldName="diet">
            <Sel field="diet" placeholder="Select Diet" options={["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"]} />
          </Field>
          <Field label="Smoking" fieldName="smoking">
            <Sel field="smoking" placeholder="Smoking Habits" options={["No", "Occasionally", "Yes"]} />
          </Field>
          <Field label="Drinking" fieldName="drinking">
            <Sel field="drinking" placeholder="Drinking Habits" options={["No", "Occasionally", "Yes"]} />
          </Field>
          <Field label="Family Type">
            <Sel field="family_type" placeholder="Family Structure" options={["Nuclear", "Joint"]} />
          </Field>
          <Field label="About Me" full fieldName="about_me">
            <Textarea 
              value={form.about_me} 
              onChange={e => update("about_me", e.target.value)} 
              placeholder="Write something interesting about yourself..." 
              rows={4} 
              className={`resize-none ${highlightMissing && !form.about_me ? "border-orange-500/50 ring-1 ring-orange-500/20 bg-orange-50/50" : ""}`} 
            />
          </Field>
        </Section>

        {/* Family Background */}
        <Section title="🏡 Family Background">
          <Field label="Father's Occupation">
            <Input value={form.father_occupation} onChange={e => update("father_occupation", e.target.value)} placeholder="e.g. Business, Retired" />
          </Field>
          <Field label="Mother's Occupation">
            <Input value={form.mother_occupation} onChange={e => update("mother_occupation", e.target.value)} placeholder="e.g. Homemaker, Teacher" />
          </Field>
          <Field label="Number of Siblings">
            <Input type="number" min="0" max="20" value={form.siblings} onChange={e => update("siblings", e.target.value)} placeholder="0" />
          </Field>
        </Section>

        {/* Partner Preferences */}
        <Section title="❤️ Partner Preferences">
          <Field label="Min Age Preference">
            <Input type="number" min="18" max="80" value={form.pref_min_age} onChange={e => update("pref_min_age", e.target.value)} placeholder="22" />
          </Field>
          <Field label="Max Age Preference">
            <Input type="number" min="18" max="80" value={form.pref_max_age} onChange={e => update("pref_max_age", e.target.value)} placeholder="40" />
          </Field>
          <Field label="Preferred Religion">
            <Sel field="pref_religion" placeholder="Any Religion" options={["Any", "Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist"]} />
          </Field>
          <Field label="Preferred Location">
            <Input value={form.pref_location} onChange={e => update("pref_location", e.target.value)} placeholder="e.g. Mumbai, Any, NRI" />
          </Field>
        </Section>

        {/* Bottom Save */}
        <div className="flex justify-end pb-8">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className={`h-12 px-10 gap-2 shadow-md text-lg transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary-hover"} text-white`}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><CheckCircle2 className="w-5 h-5" /> Profile Saved!</> : <><Save className="w-5 h-5" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
