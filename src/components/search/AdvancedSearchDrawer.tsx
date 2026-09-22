"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  SlidersHorizontal,
  X,
  GraduationCap,
  MapPin,
  Heart,
  Briefcase,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";

export interface FilterValues {
  // Professional
  professionTypes: string[]; // ['CA', 'CA Student', 'CS', 'CS Student']
  incomeRanges: string[]; // ['under5', '5to10', '10to20', '20to30', '30to50', 'above50']
  education: string;
  professionKeyword: string;
  // Demographics
  gender: string; // 'all', 'male', 'female'
  ageRange: [number, number];
  religions: string[];
  motherTongues: string[];
  city: string;
  popularCities: string[];
  caste: string;
  // Lifestyle
  diets: string[];
  smoking: string;
  drinking: string;
  familyType: string;
  // Toggles
  withPhotoOnly: boolean;
  verifiedOnly: boolean;
  minMatchScore: number;
}

export const DEFAULT_FILTERS: FilterValues = {
  professionTypes: [],
  incomeRanges: [],
  education: "",
  professionKeyword: "",
  gender: "all",
  ageRange: [18, 60],
  religions: [],
  motherTongues: [],
  city: "",
  popularCities: [],
  caste: "",
  diets: [],
  smoking: "",
  drinking: "",
  familyType: "",
  withPhotoOnly: false,
  verifiedOnly: false,
  minMatchScore: 0,
};

const POPULAR_CITIES = [
  "Mumbai",
  "Delhi NCR",
  "Ahmedabad",
  "Bangalore",
  "Pune",
  "Kolkata",
  "Hyderabad",
  "Chennai",
  "Surat",
  "Jaipur",
  "Indore",
  "NRI"
];

const RELIGION_OPTIONS = ["Hindu", "Jain", "Sikh", "Muslim", "Christian", "Parsi", "Buddhist"];
const DIET_OPTIONS = [
  { value: "veg", label: "Vegetarian" },
  { value: "jain", label: "Jain Diet" },
  { value: "nonveg", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
];
const MOTHER_TONGUE_OPTIONS = [
  "Hindi",
  "Gujarati",
  "Marathi",
  "Bengali",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Marwari",
  "Sindhi",
  "English",
];
const INCOME_OPTIONS = [
  { value: "under5", label: "Under ₹5 Lakhs" },
  { value: "5to10", label: "₹5 – 10 Lakhs" },
  { value: "10to20", label: "₹10 – 20 Lakhs" },
  { value: "20to30", label: "₹20 – 30 Lakhs" },
  { value: "30to50", label: "₹30 – 50 Lakhs" },
  { value: "above50", label: "Above ₹50 Lakhs" },
];

export function countActiveFilters(filters: FilterValues): number {
  let count = 0;
  if (filters.professionTypes.length > 0) count += filters.professionTypes.length;
  if (filters.incomeRanges.length > 0) count += filters.incomeRanges.length;
  if (filters.education) count++;
  if (filters.professionKeyword) count++;
  if (filters.gender && filters.gender !== "all") count++;
  if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60) count++;
  if (filters.religions.length > 0) count += filters.religions.length;
  if (filters.motherTongues.length > 0) count += filters.motherTongues.length;
  if (filters.city || filters.popularCities.length > 0) count += (filters.city ? 1 : 0) + filters.popularCities.length;
  if (filters.caste) count++;
  if (filters.diets.length > 0) count += filters.diets.length;
  if (filters.smoking) count++;
  if (filters.drinking) count++;
  if (filters.familyType) count++;
  if (filters.withPhotoOnly) count++;
  if (filters.verifiedOnly) count++;
  if (filters.minMatchScore > 0) count++;
  return count;
}

interface FilterFormContentProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
  onApply?: () => void;
  isSidebar?: boolean;
}

export function FilterFormContent({
  filters,
  onChange,
  onReset,
  onApply,
  isSidebar = false
}: FilterFormContentProps) {
  const [sections, setSections] = useState({
    ca_cs: true,
    demographics: true,
    lifestyle: true,
    family_match: true,
  });

  const toggleSection = (sec: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const update = <K extends keyof FilterValues>(key: K, val: FilterValues[K]) => {
    const updated = { ...filters, [key]: val };
    onChange(updated);
  };

  const toggleArrayItem = (key: "professionTypes" | "incomeRanges" | "religions" | "motherTongues" | "popularCities" | "diets", item: string) => {
    const current = filters[key] as string[];
    const next = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    update(key, next as any);
  };

  return (
    <div className="space-y-6">
      {/* 1. CA / CS Profession & Career */}
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("ca_cs")}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <h3 className="font-serif font-bold text-base text-foreground">CA &amp; CS Qualification</h3>
          </div>
          {sections.ca_cs ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {sections.ca_cs && (
          <div className="p-4 space-y-4 border-t border-border/50">
            {/* Profession Type Checkboxes */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional Stream</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CA", label: "CA (Qualified)" },
                  { id: "CA Student", label: "CA Student" },
                  { id: "CS", label: "CS (Qualified)" },
                  { id: "CS Student", label: "CS Student" }
                ].map(item => {
                  const isChecked = filters.professionTypes.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleArrayItem("professionTypes", item.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        isChecked
                          ? "bg-secondary text-white border-secondary shadow-xs"
                          : "bg-muted/30 text-foreground border-border hover:border-secondary/50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Income Range Multi-Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annual Income</Label>
              <div className="flex flex-wrap gap-1.5">
                {INCOME_OPTIONS.map(inc => {
                  const isChecked = filters.incomeRanges.includes(inc.value);
                  return (
                    <button
                      key={inc.value}
                      type="button"
                      onClick={() => toggleArrayItem("incomeRanges", inc.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/20 text-foreground/80 border-border hover:border-primary/40"
                      }`}
                    >
                      {inc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highest Education */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Highest Degree</Label>
              <Select
                value={filters.education || "any"}
                onValueChange={(v: string | null) => update("education", v === "any" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20">
                  <SelectValue placeholder="Any Degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Education Degree</SelectItem>
                  <SelectItem value="bachelors">Bachelors (B.Com / B.Tech / Other)</SelectItem>
                  <SelectItem value="masters">Masters (M.Com / MBA / M.Sc)</SelectItem>
                  <SelectItem value="ca">Chartered Accountant (ICAI)</SelectItem>
                  <SelectItem value="cs">Company Secretary (ICSI)</SelectItem>
                  <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Profession Keyword */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation / Specialization</Label>
              <Input
                placeholder="e.g. Audit, Tax, Partner, CFO, Banking"
                value={filters.professionKeyword}
                onChange={e => update("professionKeyword", e.target.value)}
                className="h-9 text-xs bg-muted/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Demographics & Location */}
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("demographics")}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-bold text-base text-foreground">Demographics &amp; Location</h3>
          </div>
          {sections.demographics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {sections.demographics && (
          <div className="p-4 space-y-4 border-t border-border/50">
            {/* Gender Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Looking For</Label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl">
                {[
                  { value: "all", label: "All" },
                  { value: "male", label: "Men (Grooms)" },
                  { value: "female", label: "Women (Brides)" }
                ].map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => update("gender", g.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      filters.gender === g.value
                        ? "bg-white text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <Label className="font-semibold uppercase tracking-wider text-muted-foreground">Age Range</Label>
                <span className="font-bold text-primary">{filters.ageRange[0]} – {filters.ageRange[1]} yrs</span>
              </div>
              <Slider
                min={18}
                max={60}
                step={1}
                value={filters.ageRange}
                onValueChange={(val: any) => update("ageRange", Array.isArray(val) ? [val[0], val[1]] : [18, 60])}
                className="py-1"
              />
            </div>

            {/* Popular Cities Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City / Region</Label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map(city => {
                  const isChecked = filters.popularCities.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleArrayItem("popularCities", city)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/20 text-foreground/80 border-border hover:border-primary/40"
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="Or type other city..."
                value={filters.city}
                onChange={e => update("city", e.target.value)}
                className="h-8 text-xs bg-muted/20 mt-1"
              />
            </div>

            {/* Religion Multi-Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Religion</Label>
              <div className="flex flex-wrap gap-1.5">
                {RELIGION_OPTIONS.map(rel => {
                  const isChecked = filters.religions.includes(rel);
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => toggleArrayItem("religions", rel)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-secondary text-white border-secondary shadow-xs"
                          : "bg-muted/20 text-foreground/80 border-border hover:border-secondary/40"
                      }`}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mother Tongue Multi-Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mother Tongue</Label>
              <div className="flex flex-wrap gap-1.5">
                {MOTHER_TONGUE_OPTIONS.map(lang => {
                  const isChecked = filters.motherTongues.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleArrayItem("motherTongues", lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/20 text-foreground/80 border-border hover:border-primary/40"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caste Search */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caste / Community</Label>
              <Input
                placeholder="e.g. Brahmin, Agarwal, Patel, Rajput..."
                value={filters.caste}
                onChange={e => update("caste", e.target.value)}
                className="h-9 text-xs bg-muted/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Lifestyle & Habits */}
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("lifestyle")}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-serif font-bold text-base text-foreground">Lifestyle &amp; Habits</h3>
          </div>
          {sections.lifestyle ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {sections.lifestyle && (
          <div className="p-4 space-y-4 border-t border-border/50">
            {/* Diet Multi-select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diet Preference</Label>
              <div className="grid grid-cols-2 gap-2">
                {DIET_OPTIONS.map(d => {
                  const isChecked = filters.diets.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleArrayItem("diets", d.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        isChecked
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/30 text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{d.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smoking */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smoking Habit</Label>
              <Select
                value={filters.smoking || "any"}
                onValueChange={(v: string | null) => update("smoking", v === "any" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Habit</SelectItem>
                  <SelectItem value="no">Non-Smoker Only</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drinking */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Drinking Habit</Label>
              <Select
                value={filters.drinking || "any"}
                onValueChange={(v: string | null) => update("drinking", v === "any" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Habit</SelectItem>
                  <SelectItem value="no">Non-Drinker Only</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Drinker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Family & Match Compatibility */}
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("family_match")}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif font-bold text-base text-foreground">Compatibility &amp; Trust</h3>
          </div>
          {sections.family_match ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {sections.family_match && (
          <div className="p-4 space-y-4 border-t border-border/50">
            {/* Family Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Family Type</Label>
              <Select
                value={filters.familyType || "any"}
                onValueChange={(v: string | null) => update("familyType", v === "any" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/20">
                  <SelectValue placeholder="Any Family Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Family Type</SelectItem>
                  <SelectItem value="nuclear">Nuclear Family</SelectItem>
                  <SelectItem value="joint">Joint Family</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Match Score */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <Label className="font-semibold uppercase tracking-wider text-muted-foreground">Min Compatibility Score</Label>
                <span className="font-bold text-secondary">{filters.minMatchScore}%+</span>
              </div>
              <Slider
                min={0}
                max={90}
                step={10}
                value={[filters.minMatchScore]}
                onValueChange={(val: any) => update("minMatchScore", Array.isArray(val) ? val[0] : (typeof val === 'number' ? val : 0))}
                className="py-1"
              />
            </div>

            {/* Quick Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-border/40">
              <label className="flex items-center justify-between gap-3 cursor-pointer p-2 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-foreground">Verified Profiles Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={e => update("verifiedOnly", e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer p-2 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📷</span>
                  <span className="text-xs font-medium text-foreground">With Photo Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={filters.withPhotoOnly}
                  onChange={e => update("withPhotoOnly", e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons for Sidebar */}
      {isSidebar && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex-1 text-xs h-9 border-border"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset All
          </Button>
          {onApply && (
            <Button
              type="button"
              size="sm"
              onClick={onApply}
              className="flex-1 text-xs h-9 bg-primary hover:bg-primary-hover text-white"
            >
              Apply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface AdvancedSearchDrawerProps {
  filters: FilterValues;
  onApplyFilters: (filters: FilterValues) => void;
  onResetFilters: () => void;
}

export function AdvancedSearchDrawer({
  filters,
  onApplyFilters,
  onResetFilters,
}: AdvancedSearchDrawerProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeCount = countActiveFilters(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onResetFilters();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-border bg-white shadow-xs relative text-xs font-semibold h-9"
      >
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <span>All Filters</span>
        {activeCount > 0 && (
          <Badge className="bg-primary text-white text-[10px] font-bold px-1.5 py-0 h-4 min-w-4 flex items-center justify-center border-0 rounded-full">
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-border shadow-xs">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-serif flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                Advanced Filters
                {activeCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                    {activeCount} Active
                  </Badge>
                )}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <FilterFormContent
              filters={localFilters}
              onChange={setLocalFilters}
              onReset={handleReset}
              isSidebar={false}
            />
          </div>

          <SheetFooter className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex gap-3 shadow-lg">
            <Button variant="outline" onClick={handleReset} className="flex-1 h-10 text-xs font-semibold">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear All
            </Button>
            <Button onClick={handleApply} className="flex-1 h-10 text-xs font-semibold bg-primary hover:bg-primary-hover text-white">
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
