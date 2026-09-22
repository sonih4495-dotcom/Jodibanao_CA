"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  ShieldCheck,
  Heart,
  Loader2,
  Sparkles,
  Flag,
  GraduationCap,
  CheckCircle2,
  SlidersHorizontal,
  X,
  RotateCcw,
  UserCheck,
  Building2,
  MapPin
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { calculateMatchScore } from "@/utils/matchScore";
import {
  AdvancedSearchDrawer,
  FilterFormContent,
  FilterValues,
  DEFAULT_FILTERS,
  countActiveFilters
} from "@/components/search/AdvancedSearchDrawer";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { toast } from "sonner";

export default function BrowsePage() {
  const supabase = createClient();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [interestsSent, setInterestsSent] = useState<Record<string, string>>({}); // toUserId -> status
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("match");
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);

  // Report dialog state
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setCurrentUser(userProfile || { id: session.user.id });

      // Get all other profiles
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id);

      // Get interests I sent or received to disable buttons
      const { data: myInterests } = await supabase
        .from('interests')
        .select('*')
        .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`);

      const interestMap: Record<string, string> = {};
      myInterests?.forEach(i => {
        const otherId = i.from_user_id === session.user.id ? i.to_user_id : i.from_user_id;
        interestMap[otherId] = i.status;
      });
      setInterestsSent(interestMap);

      if (allProfiles && userProfile) {
        // Calculate Match Scores
        const scoredProfiles = allProfiles.map(p => {
          const score = calculateMatchScore(userProfile, p);
          // Calculate realistic Age
          let age = 25;
          if (p.dob) {
            age = new Date().getFullYear() - new Date(p.dob).getFullYear();
          }
          return { ...p, calculatedScore: score, age };
        });

        // Sort by highest match score
        scoredProfiles.sort((a, b) => b.calculatedScore - a.calculatedScore);

        setProfiles(scoredProfiles);
      } else if (allProfiles) {
        setProfiles(allProfiles.map(p => ({ ...p, calculatedScore: 0, age: 25 })));
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const handleSendInterest = async (toUserId: string) => {
    if (!currentUser) return;

    // Prevent DB Trigger failures if the user has no first name
    if (!currentUser.first_name || currentUser.first_name.trim() === '') {
      toast.warning("Please enter your First Name in your profile before sending interests.");
      router.push("/profile/edit?highlight=missing");
      return;
    }

    // Optimistic UI
    setInterestsSent(prev => ({ ...prev, [toUserId]: "pending" }));

    const { error } = await supabase
      .from('interests')
      .insert({
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        status: 'pending'
      });

    if (error) {
      toast.error("Failed to send interest. " + error.message);
      // Revert Optimistic UI
      const newMap = { ...interestsSent };
      delete newMap[toUserId];
      setInterestsSent(newMap);
    } else {
      toast.success("Interest sent successfully! 💌");
    }
  };

  // Determine if current user can see a profile's photo
  const canSeePhoto = (profile: any) => {
    if (profile.photo_visibility === "everyone" || !profile.photo_visibility) return true;
    if (profile.photo_visibility === "verified_only") return currentUser?.is_verified === true;
    if (profile.photo_visibility === "mutual") {
      const status = interestsSent[profile.id];
      return status === "accepted";
    }
    return false;
  };

  // Quick Filter Toggles
  const handleQuickProfession = (type: string) => {
    setFilters(prev => {
      if (type === "all") return { ...prev, professionTypes: [] };
      const current = prev.professionTypes;
      const next = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, professionTypes: next };
    });
  };

  const handleQuickGender = (g: string) => {
    setFilters(prev => ({
      ...prev,
      gender: prev.gender === g ? "all" : g
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
    toast.info("Filters reset to default.");
  };

  // Filter Engine
  const filteredProfiles = profiles.filter(p => {
    // 1. Keyword search (Name, city, caste, education, profession, about_me)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchesKeyword =
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.caste?.toLowerCase().includes(q) ||
        p.education?.toLowerCase().includes(q) ||
        p.profession?.toLowerCase().includes(q) ||
        p.profession_type?.toLowerCase().includes(q) ||
        p.about_me?.toLowerCase().includes(q);
      if (!matchesKeyword) return false;
    }

    // 2. Gender
    if (filters.gender && filters.gender !== "all") {
      if (p.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
    }

    // 3. Age Range
    if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;

    // 4. CA / CS Profession Stream
    if (filters.professionTypes.length > 0) {
      const pType = (p.profession_type || "").toLowerCase();
      const pTitle = (p.profession || "").toLowerCase();
      const matchesType = filters.professionTypes.some(type => {
        const t = type.toLowerCase();
        return pType.includes(t) || pTitle.includes(t);
      });
      if (!matchesType) return false;
    }

    // 5. Income Range
    if (filters.incomeRanges.length > 0) {
      const pIncome = (p.income || "").toLowerCase();
      const matchesIncome = filters.incomeRanges.some(inc => {
        if (inc === "under5") return pIncome.includes("under5") || pIncome.includes("under 5") || pIncome.includes("< 5");
        if (inc === "5to10") return pIncome.includes("5to10") || pIncome.includes("5-10") || pIncome.includes("5 - 10");
        if (inc === "10to20") return pIncome.includes("10to20") || pIncome.includes("10-20") || pIncome.includes("10 - 20") || pIncome.includes("15-20");
        if (inc === "20to30") return pIncome.includes("20to30") || pIncome.includes("20-30") || pIncome.includes("20 - 30");
        if (inc === "30to50") return pIncome.includes("30to50") || pIncome.includes("30-50") || pIncome.includes("30 - 50");
        if (inc === "above50") return pIncome.includes("above50") || pIncome.includes("above 50") || pIncome.includes("> 50") || pIncome.includes("50+");
        return pIncome.includes(inc.toLowerCase());
      });
      if (!matchesIncome) return false;
    }

    // 6. Education
    if (filters.education && filters.education !== "any") {
      const pEdu = (p.education || "").toLowerCase();
      if (!pEdu.includes(filters.education.toLowerCase())) return false;
    }

    // 7. Profession Keyword
    if (filters.professionKeyword) {
      const kw = filters.professionKeyword.toLowerCase();
      const pProf = (p.profession || "").toLowerCase();
      const pType = (p.profession_type || "").toLowerCase();
      if (!pProf.includes(kw) && !pType.includes(kw)) return false;
    }

    // 8. Religion
    if (filters.religions.length > 0) {
      const pRel = (p.religion || "").toLowerCase();
      const matchesRel = filters.religions.some(r => pRel.includes(r.toLowerCase()));
      if (!matchesRel) return false;
    }

    // 9. Mother Tongue
    if (filters.motherTongues.length > 0) {
      const pLang = (p.mother_tongue || "").toLowerCase();
      const matchesLang = filters.motherTongues.some(l => pLang.includes(l.toLowerCase()));
      if (!matchesLang) return false;
    }

    // 10. City / Location
    if (filters.popularCities.length > 0 || filters.city) {
      const pCity = (p.city || "").toLowerCase();
      const matchesPopular = filters.popularCities.some(c => pCity.includes(c.toLowerCase()));
      const matchesFreeText = filters.city ? pCity.includes(filters.city.toLowerCase()) : false;
      if (filters.popularCities.length > 0 && filters.city) {
        if (!matchesPopular && !matchesFreeText) return false;
      } else if (filters.popularCities.length > 0) {
        if (!matchesPopular) return false;
      } else if (filters.city) {
        if (!matchesFreeText) return false;
      }
    }

    // 11. Caste
    if (filters.caste) {
      const pCaste = (p.caste || "").toLowerCase();
      if (!pCaste.includes(filters.caste.toLowerCase())) return false;
    }

    // 12. Diet
    if (filters.diets.length > 0) {
      const pDiet = (p.diet || "").toLowerCase();
      const matchesDiet = filters.diets.some(d => pDiet.includes(d.toLowerCase()));
      if (!matchesDiet) return false;
    }

    // 13. Smoking
    if (filters.smoking && filters.smoking !== "any") {
      if ((p.smoking || "").toLowerCase() !== filters.smoking.toLowerCase()) return false;
    }

    // 14. Drinking
    if (filters.drinking && filters.drinking !== "any") {
      if ((p.drinking || "").toLowerCase() !== filters.drinking.toLowerCase()) return false;
    }

    // 15. Family Type
    if (filters.familyType && filters.familyType !== "any") {
      if ((p.family_type || "").toLowerCase() !== filters.familyType.toLowerCase()) return false;
    }

    // 16. Verified Only
    if (filters.verifiedOnly && !p.is_verified) {
      return false;
    }

    // 17. With Photo Only
    if (filters.withPhotoOnly && !p.avatar_url) {
      return false;
    }

    // 18. Minimum Match Score
    if (filters.minMatchScore > 0 && (p.calculatedScore || 0) < filters.minMatchScore) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "age_asc") return a.age - b.age;
    if (sortBy === "age_desc") return b.age - a.age;
    return b.calculatedScore - a.calculatedScore; // "match" is default
  });

  const activeFilterCount = countActiveFilters(filters) + (searchTerm ? 1 : 0);

  if (loading) {
    return (
      <div className="bg-muted/30 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 min-h-screen pb-16">
      {/* 1. Header Banner & Quick Search */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary text-white py-8 px-4 shadow-md">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
                <GraduationCap className="w-4 h-4 text-yellow-300" />
                Chartered Accountants &amp; Company Secretaries Community
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                Find Your Compatible CA / CS Match
              </h1>
            </div>

            {/* Quick Search Input */}
            <div className="w-full md:w-96 bg-white/95 backdrop-blur-md rounded-2xl p-1 flex items-center shadow-lg border border-white/30 text-foreground">
              <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
              <Input
                placeholder="Search by name, city, specialization..."
                className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 hover:bg-muted/50 rounded-full mr-1 text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stream Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/15 text-xs">
            <span className="font-semibold text-white/80 shrink-0 mr-1">Stream:</span>
            {[
              { id: "all", label: "All Streams" },
              { id: "CA", label: "CA (Qualified)" },
              { id: "CA Student", label: "CA Student" },
              { id: "CS", label: "CS (Qualified)" },
              { id: "CS Student", label: "CS Student" },
            ].map(p => {
              const isSelected = p.id === "all" ? filters.professionTypes.length === 0 : filters.professionTypes.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickProfession(p.id)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    isSelected
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            <div className="h-4 w-px bg-white/25 mx-1 hidden sm:block" />

            {/* Quick Gender Toggle */}
            <span className="font-semibold text-white/80 shrink-0 mr-1 hidden sm:inline">Looking for:</span>
            {[
              { id: "male", label: "Grooms" },
              { id: "female", label: "Brides" },
            ].map(g => {
              const isSelected = filters.gender === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleQuickGender(g.id)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    isSelected
                      ? "bg-white text-secondary shadow-xs font-bold"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}

            <div className="h-4 w-px bg-white/25 mx-1 hidden md:block" />

            {/* Quick Verified Toggle */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
              className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                filters.verifiedOnly
                  ? "bg-blue-500 text-white font-bold shadow-xs"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Only
            </button>

            {/* Quick Photo Toggle */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, withPhotoOnly: !prev.withPhotoOnly }))}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filters.withPhotoOnly
                  ? "bg-amber-400 text-slate-900 font-bold shadow-xs"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              📷 With Photo
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area: Sidebar + Grid */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* DESKTOP FILTERS SIDEBAR */}
          <div className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-24">
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h2 className="font-serif font-bold text-base text-foreground">Filter Profiles</h2>
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>

              <FilterFormContent
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
                isSidebar={true}
              />
            </div>
          </div>

          {/* PROFILES & CONTROLS GRID */}
          <div className="flex-1 w-full min-w-0">

            {/* Top Toolbar (Sort, Results count, Mobile Filter Button) */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-foreground">
                  {filteredProfiles.length} {filteredProfiles.length === 1 ? "Match" : "Matches"} Found
                </h2>
                {activeFilterCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {activeFilterCount} active filters
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Drawer Button */}
                <div className="lg:hidden">
                  <AdvancedSearchDrawer
                    filters={filters}
                    onApplyFilters={setFilters}
                    onResetFilters={handleResetFilters}
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Sort:</span>
                  <Select value={sortBy} onValueChange={(v: string | null) => setSortBy(v ?? "match")}>
                    <SelectTrigger className="w-[160px] h-9 text-xs bg-muted/20 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">🎯 Best Match Score</SelectItem>
                      <SelectItem value="newest">✨ Newest Members</SelectItem>
                      <SelectItem value="age_asc">👶 Age: Youngest First</SelectItem>
                      <SelectItem value="age_desc">🧓 Age: Eldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active Filters Bar (Pills with 'x' to dismiss) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-6 p-3 bg-card border border-border/60 rounded-xl">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Active:</span>

                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    Search: "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}

                {filters.professionTypes.map(t => (
                  <Badge key={t} className="gap-1 text-xs py-0.5 px-2 bg-secondary/15 text-secondary border border-secondary/30">
                    {t}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleQuickProfession(t)} />
                  </Badge>
                ))}

                {filters.gender !== "all" && (
                  <Badge className="gap-1 text-xs py-0.5 px-2 bg-primary/15 text-primary border border-primary/30">
                    {filters.gender === "male" ? "Grooms (Men)" : "Brides (Women)"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, gender: "all" }))} />
                  </Badge>
                )}

                {(filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60) && (
                  <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    Age: {filters.ageRange[0]}-{filters.ageRange[1]} yrs
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, ageRange: [18, 60] }))} />
                  </Badge>
                )}

                {filters.popularCities.map(c => (
                  <Badge key={c} variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    📍 {c}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, popularCities: prev.popularCities.filter(x => x !== c) }))} />
                  </Badge>
                ))}

                {filters.city && (
                  <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    City: {filters.city}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, city: "" }))} />
                  </Badge>
                )}

                {filters.religions.map(r => (
                  <Badge key={r} variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    {r}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, religions: prev.religions.filter(x => x !== r) }))} />
                  </Badge>
                ))}

                {filters.diets.map(d => (
                  <Badge key={d} variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    Diet: {d}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, diets: prev.diets.filter(x => x !== d) }))} />
                  </Badge>
                ))}

                {filters.verifiedOnly && (
                  <Badge className="gap-1 text-xs py-0.5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                    ⭐ Verified Only
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: false }))} />
                  </Badge>
                )}

                {filters.withPhotoOnly && (
                  <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 bg-muted hover:bg-muted">
                    📷 With Photo
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, withPhotoOnly: false }))} />
                  </Badge>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-primary font-semibold hover:underline ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Empty State */}
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border p-8 shadow-xs">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-1">No CA/CS Profiles Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  We couldn't find any profiles matching all your filter criteria. Try loosening some filters or resetting them.
                </p>
                <Button onClick={handleResetFilters} variant="outline" className="text-xs h-9">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset All Filters
                </Button>
              </div>
            ) : (
              /* Profile Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => {
                  const interestStatus = interestsSent[profile.id];
                  const btnConfig = {
                    "pending": { text: "Interest Sent", class: "bg-muted text-foreground pointer-events-none" },
                    "accepted": { text: "Mutual Match! ❤️", class: "bg-gradient-to-r from-pink-500 to-rose-500 text-white pointer-events-none border-0" },
                    "declined": { text: "Declined", class: "bg-muted/50 text-muted-foreground pointer-events-none" },
                  }[interestStatus] || { text: "Send Interest", class: "bg-primary hover:bg-primary-hover text-white cursor-pointer" };

                  const showPhoto = canSeePhoto(profile);

                  return (
                    <Card key={profile.id} className="overflow-hidden group border-border/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col rounded-2xl bg-card">
                      {/* Photo Area */}
                      <div className="aspect-[4/5] relative bg-muted overflow-hidden">
                        {/* Match Score Badge */}
                        <Badge className="absolute top-3 left-3 z-10 bg-black/60 hover:bg-black/70 text-white border-0 backdrop-blur-md shadow-xs font-semibold flex items-center gap-1 text-xs">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> {profile.calculatedScore}% Match
                        </Badge>

                        {/* Verified badge */}
                        {profile.is_verified && (
                          <div className="absolute top-3 right-3 z-10 bg-blue-500 text-white rounded-full p-1 shadow-md" title="Verified CA/CS Professional">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}

                        {/* Photo with visibility-based blur logic */}
                        <div className="absolute inset-0 z-0">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Profile"
                              className={`w-full h-full object-cover transition-all duration-500 ${showPhoto ? "blur-0 scale-100" : "blur-md scale-110"} group-hover:scale-105`}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-primary/30 to-secondary/30 backdrop-blur-2xl blur-md scale-110 flex items-center justify-center transition-transform group-hover:scale-105">
                              <ShieldCheck className="w-16 h-16 text-foreground/20 opacity-50" />
                            </div>
                          )}
                          {!showPhoto && profile.avatar_url && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-4 text-center">
                              <div className="bg-black/40 rounded-full p-3 mb-2 backdrop-blur-md">
                                <ShieldCheck className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-[11px] font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
                                Photo visible upon mutual match
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom gradient with Name & Age */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 md:pt-24 pointer-events-none">
                          <h3 className="text-white font-serif font-bold text-xl mb-0.5 flex items-center gap-2">
                            {profile.first_name || "Member"} {profile.last_name || ""}
                          </h3>
                          <p className="text-white/90 text-xs font-medium flex items-center gap-1.5">
                            <span>{profile.age} yrs</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {profile.city || "Location not set"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Card Content & Details */}
                      <CardContent className="p-4 bg-card flex flex-col flex-1 gap-3">
                        {/* CA/CS Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-secondary/10 text-secondary border-secondary/30 text-xs gap-1 font-semibold py-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {profile.profession_type || profile.profession || "CA / CS Professional"}
                          </Badge>
                          {profile.income && (
                            <span className="text-xs font-bold text-primary">
                              {profile.income}
                            </span>
                          )}
                        </div>

                        {/* Profile Info Grid */}
                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-foreground/80 p-2.5 bg-muted/20 rounded-xl border border-border/40 flex-1">
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Education</span>
                            <span className="truncate block font-medium capitalize">{profile.education || "Not set"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Religion / Caste</span>
                            <span className="truncate block font-medium capitalize">
                              {profile.religion || "Any"}{profile.caste ? `, ${profile.caste}` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Mother Tongue</span>
                            <span className="truncate block font-medium capitalize">{profile.mother_tongue || "Not set"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Diet</span>
                            <span className="truncate block font-medium capitalize">{profile.diet || "Any"}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1 mt-auto">
                          <Button
                            onClick={(e) => { e.preventDefault(); if (!interestStatus) handleSendInterest(profile.id); }}
                            className={`flex-1 text-xs font-semibold h-10 rounded-xl shadow-xs transition-colors duration-300 ${btnConfig.class}`}
                          >
                            {btnConfig.text}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Report profile"
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setReportTarget({ id: profile.id, name: profile.first_name || "User" })}
                          >
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        reportedUserId={reportTarget?.id || ""}
        reportedName={reportTarget?.name || "User"}
      />
    </div>
  );
}
