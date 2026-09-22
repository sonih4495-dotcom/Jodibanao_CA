"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Eye, EyeOff, Loader2, GraduationCap, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", profileFor: "self", gender: "", dob: "",
    // CA/CS specific fields (NEW)
    professionType: "", membershipNumber: "",
    religion: "", caste: "", motherTongue: "", city: "",
    education: "", profession: "", income: "",
    about: "", diet: "", smoking: "", drinking: "",
    familyType: "", fatherOccupation: "", motherOccupation: "", siblings: "",
    prefMinAge: "", prefMaxAge: "", prefReligion: "", prefLocation: "",
    avatarUrl: "",
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem('jodibanao_register_draft');
    if (draft) {
      toast("Found a saved draft", {
        action: {
          label: "Resume",
          onClick: () => {
            const parsed = JSON.parse(draft);
            setFormData(parsed.formData);
            setStep(parsed.step);
          }
        },
        duration: 10000
      });
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem('jodibanao_register_draft', JSON.stringify({ formData, step }));
    toast.success("Draft saved successfully!");
  };

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    updateForm("avatarUrl", "");
  };

  const uploadPhotoToSupabase = async (): Promise<string> => {
    if (!photoFile) return "";
    setIsUploading(true);
    const supabase = createClient();
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, photoFile);

    setIsUploading(false);
    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password) {
      setError("Please provide an email and password in Step 1.");
      toast.error("Please provide an email and password in Step 1.");
      setStep(1);
      return;
    }
    
    const consentCb = document.getElementById('consent') as HTMLInputElement;
    if (!consentCb?.checked) {
      toast.error("Please agree to the privacy policy and terms.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      let uploadedUrl = formData.avatarUrl;
      if (photoFile) {
        try {
          uploadedUrl = await uploadPhotoToSupabase();
        } catch (uploadErr) {
          toast.error("Failed to upload photo. Proceeding without photo.");
        }
      }

      const payload = { ...formData, avatarUrl: uploadedUrl };

      // 1. Call server API to register user (auto-confirmed without email verification)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Registration failed. Please try again.");
      }

      // 2. Automatically log the user in immediately
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      localStorage.removeItem('jodibanao_register_draft');
      toast.success("Welcome to Jodibanao! Your account is ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    // Validate required fields per step before advancing
    if (step === 1) {
      if (!formData.firstName.trim()) { toast.error("Please enter your first name."); return; }
      if (!formData.email.trim()) { toast.error("Please enter your email address."); return; }
      if (!formData.password || formData.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
      if (!formData.gender) { toast.error("Please select your gender."); return; }
      if (!formData.dob) { toast.error("Please enter your date of birth."); return; }
      // CA/CS Gate
      if (!formData.professionType) { toast.error("Please select your CA/CS profession type."); return; }
      if (!formData.membershipNumber.trim()) { toast.error("Membership / Student ID number is required."); return; }
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Step indicator
  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;
  
  const stepTooltips = [
    "Basic Info", "Background", "Career", "Lifestyle", "Family", "Preferences", "Photos"
  ];

  return (
    <div className="min-h-screen bg-muted/40 py-12 px-4 relative flex flex-col justify-center">
      {/* Decorative background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 -z-10" />
      <div className="absolute top-24 right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="container mx-auto max-w-2xl px-4 relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-serif text-3xl font-bold tracking-tight text-primary">
              Jodibanao
            </span>
          </Link>
          {/* CA/CS exclusive banner */}
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 text-secondary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <GraduationCap className="w-4 h-4" />
            Exclusively for CA &amp; CS Professionals
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Create Your Profile</h1>
          <p className="text-muted-foreground">It takes just 5 minutes to set up your perfect match profile.</p>
        </div>

        {/* Progress Bar & Dots */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3 px-2 relative z-10">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex flex-col items-center group relative">
                <button
                  type="button"
                  onClick={() => i + 1 < step && setStep(i + 1)}
                  disabled={i + 1 > step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm
                    ${i + 1 === step ? 'bg-primary text-white border-2 border-primary/20 ring-4 ring-primary/10' : 
                      i + 1 < step ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30' : 
                      'bg-muted text-muted-foreground cursor-not-allowed'}`}
                >
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
                <span className="absolute -bottom-6 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {stepTooltips[i]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 px-1 mt-6">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% completed</span>
          </div>
          <div className="h-2 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="bg-muted/10 border-b border-border pb-6 pt-8 px-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-serif">
                  {step === 1 && "Basic Information"}
                  {step === 2 && "Background Details"}
                  {step === 3 && "Education & Career"}
                  {step === 4 && "About & Lifestyle"}
                  {step === 5 && "Family Details"}
                  {step === 6 && "Partner Preferences"}
                  {step === 7 && "Profile Photos"}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {step === 1 && "Let's start with your basics. Membership details are required to join."}
                  {step === 2 && "Tell us about your background."}
                  {step === 3 && "Where do you work and what did you study?"}
                  {step === 4 && "Describe yourself and your habits."}
                  {step === 5 && "Information about your immediate family."}
                  {step === 6 && "What qualities are you looking for?"}
                  {step === 7 && "Add photos to complete your profile. Photos are blurred until you connect."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

              {/* STEP 1: Basic Info + CA/CS Fields */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                  {success && (
                    <div className="bg-green-100/50 border border-green-500 text-green-700 text-sm p-4 rounded-md font-medium">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md font-medium">
                      {error}
                    </div>
                  )}

                  {/* CA/CS Gate — shown prominently at top of Step 1 */}
                  <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-5 h-5 text-secondary" />
                      <p className="font-semibold text-sm text-secondary">Professional Verification (Required)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="professionType">
                        I am a <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.professionType} onValueChange={(v: string | null) => updateForm("professionType", v ?? "")}>
                        <SelectTrigger id="professionType" className="bg-white">
                          <SelectValue placeholder="Select your profession type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">CA — Chartered Accountant</SelectItem>
                          <SelectItem value="CA Student">CA Student (ICAI)</SelectItem>
                          <SelectItem value="CS">CS — Company Secretary</SelectItem>
                          <SelectItem value="CS Student">CS Student (ICSI)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="membershipNumber">
                        Membership / Student ID Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="membershipNumber"
                        placeholder="e.g. 123456 or STU/XXXX/2024"
                        value={formData.membershipNumber}
                        onChange={(e: any) => updateForm("membershipNumber", e.target.value)}
                        className="bg-white"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your ICAI or ICSI membership/registration number. This platform is exclusively for CA &amp; CS professionals.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                      <Input id="firstName" placeholder="Rahul" value={formData.firstName} onChange={(e: any) => updateForm("firstName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Sharma" value={formData.lastName} onChange={(e: any) => updateForm("lastName", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={formData.email} onChange={(e: any) => updateForm("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password (min 8 chars)"
                        required
                        className="pr-10"
                        value={formData.password}
                        onChange={(e: any) => updateForm("password", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Profile created for</Label>
                    <Select defaultValue="self" value={formData.profileFor} onValueChange={(v: string | null) => updateForm("profileFor", v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Myself</SelectItem>
                        <SelectItem value="son">Son</SelectItem>
                        <SelectItem value="daughter">Daughter</SelectItem>
                        <SelectItem value="brother">Brother</SelectItem>
                        <SelectItem value="sister">Sister</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                      <Select value={formData.gender} onValueChange={(v: string | null) => updateForm("gender", v ?? "")}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                      <Input id="dob" type="date" value={formData.dob} onChange={(e: any) => updateForm("dob", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Background */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Select value={formData.religion} onValueChange={(v: string | null) => updateForm("religion", v ?? "")}>
                      <SelectTrigger id="religion">
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

                  <div className="space-y-2">
                    <Label htmlFor="caste">Caste / Community <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input id="caste" placeholder="e.g. Brahmin, Rajput, etc." value={formData.caste} onChange={(e: any) => updateForm("caste", e.target.value)} />
                    <p className="text-xs text-muted-foreground">We believe in equality. This field is completely optional.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Mother Tongue</Label>
                      <Select value={formData.motherTongue} onValueChange={(v: string | null) => updateForm("motherTongue", v ?? "")}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hindi">Hindi</SelectItem>
                          <SelectItem value="gujarati">Gujarati</SelectItem>
                          <SelectItem value="marathi">Marathi</SelectItem>
                          <SelectItem value="bengali">Bengali</SelectItem>
                          <SelectItem value="tamil">Tamil</SelectItem>
                          <SelectItem value="telugu">Telugu</SelectItem>
                          <SelectItem value="punjabi">Punjabi</SelectItem>
                          <SelectItem value="kannada">Kannada</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Current City</Label>
                      <Input id="city" placeholder="e.g. Mumbai, New York" value={formData.city} onChange={(e: any) => updateForm("city", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Education & Career */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Show CA/CS badge reminder */}
                  {formData.professionType && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary/10 text-secondary border-secondary/30 text-sm px-3 py-1">
                        <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                        {formData.professionType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">ID: {formData.membershipNumber}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="education">Highest Education</Label>
                    <Select value={formData.education} onValueChange={(v: string | null) => updateForm("education", v ?? "")}>
                      <SelectTrigger id="education">
                        <SelectValue placeholder="Select Degree" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelors">Bachelors Degree</SelectItem>
                        <SelectItem value="masters">Masters Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="highschool">High School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession / Occupation</Label>
                    <Input id="profession" placeholder="e.g. Practising CA, CS in Company" value={formData.profession} onChange={(e: any) => updateForm("profession", e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income">Annual Income Range</Label>
                    <Select value={formData.income} onValueChange={(v: string | null) => updateForm("income", v ?? "")}>
                      <SelectTrigger id="income">
                        <SelectValue placeholder="Select Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under5">Under ₹5 Lakhs</SelectItem>
                        <SelectItem value="5to10">₹5 – 10 Lakhs</SelectItem>
                        <SelectItem value="10to20">₹10 – 20 Lakhs</SelectItem>
                        <SelectItem value="20to30">₹20 – 30 Lakhs</SelectItem>
                        <SelectItem value="30to50">₹30 – 50 Lakhs</SelectItem>
                        <SelectItem value="above50">Above ₹50 Lakhs</SelectItem>
                        <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 4: Lifestyle */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="about">About Me</Label>
                    <Textarea id="about" placeholder="Write a few lines about your personality, interests, and what you're looking for..." className="min-h-[100px] resize-none" value={formData.about} onChange={(e: any) => updateForm("about", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Diet</Label>
                      <Select value={formData.diet} onValueChange={(v: string | null) => updateForm("diet", v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">Vegetarian</SelectItem>
                          <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="jain">Jain Diet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Smoking</Label>
                      <Select value={formData.smoking} onValueChange={(v: string | null) => updateForm("smoking", v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="occasionally">Occasionally</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Drinking</Label>
                      <Select value={formData.drinking} onValueChange={(v: string | null) => updateForm("drinking", v ?? "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="occasionally">Occasionally</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Family Details */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <Label>Family Type</Label>
                    <Select value={formData.familyType} onValueChange={(v: string | null) => updateForm("familyType", v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Family Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuclear">Nuclear Family</SelectItem>
                        <SelectItem value="joint">Joint Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="father">Father&apos;s Occupation</Label>
                      <Input id="father" placeholder="e.g. Businessman, Retired" value={formData.fatherOccupation} onChange={(e: any) => updateForm("fatherOccupation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother">Mother&apos;s Occupation</Label>
                      <Input id="mother" placeholder="e.g. Homemaker, Teacher" value={formData.motherOccupation} onChange={(e: any) => updateForm("motherOccupation", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Siblings</Label>
                    <Select value={formData.siblings} onValueChange={(v: string | null) => updateForm("siblings", v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1 Sibling</SelectItem>
                        <SelectItem value="2">2 Siblings</SelectItem>
                        <SelectItem value="3">3+ Siblings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 6: Partner Preferences */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Age</Label>
                      <Input type="number" placeholder="22" value={formData.prefMinAge} onChange={(e: any) => updateForm("prefMinAge", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Age</Label>
                      <Input type="number" placeholder="35" value={formData.prefMaxAge} onChange={(e: any) => updateForm("prefMaxAge", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Religion</Label>
                    <Select value={formData.prefReligion} onValueChange={(v: string | null) => updateForm("prefReligion", v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same">Same as mine</SelectItem>
                        <SelectItem value="any">Open to all</SelectItem>
                        <SelectItem value="hindu">Hindu</SelectItem>
                        <SelectItem value="muslim">Muslim</SelectItem>
                        <SelectItem value="sikh">Sikh</SelectItem>
                        <SelectItem value="christian">Christian</SelectItem>
                        <SelectItem value="jain">Jain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Location</Label>
                    <Input placeholder="e.g. India, US, Same City, Any" value={formData.prefLocation} onChange={(e: any) => updateForm("prefLocation", e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 7: Photo */}
              {step === 7 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                    <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-1">Privacy Guarantee</h3>
                    <p className="text-sm text-muted-foreground">Your photos will be blurred by default. You control who sees your photo — everyone, only mutual matches, or only verified professionals.</p>
                  </div>

                  {!photoPreview ? (
                    <div className="relative border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center bg-card hover:bg-muted/50 cursor-pointer transition-colors text-center overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png" 
                        onChange={handlePhotoUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                      <h4 className="font-semibold text-foreground mb-1">Upload Profile Photo</h4>
                      <p className="text-sm text-muted-foreground mb-4">Select an image to upload now, or add one later.</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG up to 5MB</p>
                    </div>
                  ) : (
                    <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border border-border shadow-md">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={removePhoto} 
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 pt-2">
                    <input type="checkbox" id="consent" className="mt-1" />
                    <Label htmlFor="consent" className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the Privacy Policy and terms. I confirm that I am a CA/CS professional or student, at least 18 years old, and legally permitted to use this service.
                    </Label>
                  </div>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between items-center p-8 pt-0 border-t border-border mt-2 pt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 border-border hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleSaveDraft}
                className="text-muted-foreground hover:text-foreground"
                title="Save draft"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>

            {step < totalSteps ? (
              <Button
                onClick={nextStep}
                className="px-8 bg-primary hover:bg-primary-hover text-white flex gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleRegister}
                disabled={isLoading || isUploading}
                className="px-8 bg-secondary hover:bg-secondary/90 text-white flex gap-2 shadow-md w-auto"
              >
                {(isLoading || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isUploading ? "Uploading..." : "Complete Registration"}
                {!(isLoading || isUploading) && <CheckCircle2 className="w-4 h-4" />}
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
