import React, { useState } from "react";
import {
  Cuisine,
  DietaryPreference,
  UserPreferences,
  MealSlot,
  CookingTimePreference,
  PlanDuration,
  CalorieGoal,
} from "../types";
import {
  ChevronLeft,
  Check,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  Clock,
  Sparkles,
  Calendar,
  Flame,
} from "lucide-react";

interface PreferencesScreenProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onContinue: () => void;
  onBack: () => void;
  mode?: "new_plan" | "add_days";
  existingPlanLength?: number;
  onAddDays?: (updatedPrefs: UserPreferences, daysToAdd: number) => Promise<void> | void;
  onStartFreshPlan?: (updatedPrefs: UserPreferences) => void;
}

interface CuisineInfo {
  name: Cuisine;
  region: "North" | "South" | "West" | "East & Other";
  staples: string;
}

const CUISINE_LIST: CuisineInfo[] = [
  // North
  { name: "North Indian", region: "North", staples: "Roti, dal & seasonal sabzi" },
  { name: "Punjabi", region: "North", staples: "Paratha, rajma & chole" },
  { name: "Rajasthani", region: "North", staples: "Dal baati, gatte & khichdi" },
  { name: "Bihari / UP", region: "North", staples: "Litti, sattu & spicy curries" },
  { name: "Kashmiri", region: "North", staples: "Dum aloo & spiced gravies" },
  // South
  { name: "South Indian", region: "South", staples: "Dosa, idli, sambar & rasam" },
  { name: "Kerala", region: "South", staples: "Appam, stew & thoran" },
  { name: "Andhra / Telugu", region: "South", staples: "Pappu, vepudu & rasam" },
  // West
  { name: "Maharashtrian", region: "West", staples: "Poha, usal, bhakri & amti" },
  { name: "Gujarati", region: "West", staples: "Thepla, kadhi & dal dhokli" },
  { name: "Goan", region: "West", staples: "Fish curry, xacuti & poi" },
  // East & Other
  { name: "Bengali", region: "East & Other", staples: "Shukto, luchi & jhol" },
  { name: "North Eastern", region: "East & Other", staples: "Steamed greens & broths" },
  { name: "Chinese/Indo-Chinese", region: "East & Other", staples: "Noodles, fried rice & stir-fry" },
  { name: "Continental", region: "East & Other", staples: "Pastas, bakes & toasts" },
];

const REGION_TABS = [
  { id: "All", label: "All", count: 15 },
  { id: "North", label: "North", count: 5 },
  { id: "South", label: "South", count: 3 },
  { id: "West", label: "West", count: 3 },
  { id: "East & Other", label: "East & Other", count: 4 },
] as const;

type RegionFilter = (typeof REGION_TABS)[number]["id"];

const DIETARY_OPTIONS: DietaryPreference[] = ["Veg", "Non-veg", "Both"];

const COOKING_TIMES: CookingTimePreference[] = [
  "Under 15 mins",
  "15–30 mins",
  "30–45 mins",
  "Flexible",
];

const MEAL_TYPES: {
  slot: MealSlot;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slot: "breakfast", label: "Breakfast", sub: "Morning", icon: Sunrise },
  { slot: "lunch", label: "Lunch", sub: "Midday", icon: Sun },
  { slot: "snacks", label: "Snacks", sub: "Tea-time", icon: Coffee },
  { slot: "dinner", label: "Dinner", sub: "Night", icon: Moon },
];

const SPECIFIC_CALORIE_OPTIONS: {
  value: CalorieGoal;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    value: "~1,200 kcal",
    label: "~1,200 kcal",
    badge: "Deficit",
    desc: "Light portions",
  },
  {
    value: "~1,500 kcal",
    label: "~1,500 kcal",
    badge: "Moderate",
    desc: "Everyday deficit",
  },
  {
    value: "~1,800 kcal",
    label: "~1,800 kcal",
    badge: "Standard",
    desc: "Daily balance",
  },
  {
    value: "~2,200 kcal",
    label: "~2,200 kcal",
    badge: "Active",
    desc: "High energy fuel",
  },
];

const PLAN_DURATIONS: { value: PlanDuration; label: string; sub: string }[] = [
  { value: "1 day", label: "1 Day", sub: "Today" },
  { value: "3 days", label: "3 Days", sub: "Sprint" },
  { value: "1 week", label: "1 Week", sub: "7 Days" },
];

const ADD_DAYS_OPTIONS = [
  { value: 1, label: "+1 Day", sub: "Next Day" },
  { value: 2, label: "+2 Days", sub: "Couple Days" },
  { value: 3, label: "+3 Days", sub: "Sprint" },
  { value: 7, label: "+7 Days", sub: "Full Week" },
];

export function PreferencesScreen({
  preferences,
  onUpdatePreferences,
  onContinue,
  onBack,
  mode = "new_plan",
  existingPlanLength = 0,
  onAddDays,
  onStartFreshPlan,
}: PreferencesScreenProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("All");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAddDaysMode = mode === "add_days" && existingPlanLength > 0;
  const initialDaysToAdd =
    preferences.planDuration === "1 day"
      ? 1
      : preferences.planDuration === "1 week"
      ? 7
      : 3;
  const [daysToAdd, setDaysToAdd] = useState<number>(initialDaysToAdd);

  const currentMealTypes: MealSlot[] =
    preferences.mealTypes && preferences.mealTypes.length > 0
      ? preferences.mealTypes
      : ["dinner"];

  const toggleCuisine = (c: Cuisine) => {
    let next = [...preferences.cuisines];
    if (next.includes(c)) {
      if (next.length > 1) {
        next = next.filter((item) => item !== c);
      }
    } else {
      next.push(c);
    }
    onUpdatePreferences({ ...preferences, cuisines: next });
  };

  const handleSelectStaples = () => {
    onUpdatePreferences({
      ...preferences,
      cuisines: ["North Indian", "South Indian"],
    });
  };

  const handleSelectAllInView = () => {
    if (regionFilter === "All") {
      onUpdatePreferences({
        ...preferences,
        cuisines: CUISINE_LIST.map((c) => c.name),
      });
    } else {
      const regionNames = CUISINE_LIST.filter((c) => c.region === regionFilter).map(
        (c) => c.name
      );
      const combined = Array.from(new Set([...preferences.cuisines, ...regionNames]));
      onUpdatePreferences({ ...preferences, cuisines: combined });
    }
  };

  const setDietary = (dietary: DietaryPreference) => {
    onUpdatePreferences({ ...preferences, dietary });
  };

  const setCookingTime = (cookingTime: CookingTimePreference) => {
    onUpdatePreferences({ ...preferences, cookingTime });
  };

  const toggleMealType = (slot: MealSlot) => {
    let next = [...currentMealTypes];
    if (next.includes(slot)) {
      if (next.length > 1) {
        next = next.filter((s) => s !== slot);
      }
    } else {
      next.push(slot);
    }
    onUpdatePreferences({ ...preferences, mealTypes: next });
  };

  const setCalorieGoal = (calorieGoal: CalorieGoal) => {
    onUpdatePreferences({ ...preferences, calorieGoal });
  };

  const setPlanDuration = (planDuration: PlanDuration) => {
    onUpdatePreferences({ ...preferences, planDuration });
  };

  const filteredCuisines =
    regionFilter === "All"
      ? CUISINE_LIST
      : CUISINE_LIST.filter((c) => c.region === regionFilter);

  const isFlexibleCalorie = !preferences.calorieGoal || preferences.calorieGoal === "Flexible";

  return (
    <div className="flex flex-col min-h-full justify-between pb-8 pt-4 px-5 sm:px-6">
      <div className="space-y-5">
        {/* Header navigation */}
        <div className="flex items-center gap-3">
          <button
            id="pref-back-btn"
            type="button"
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#F3EFE7] active:scale-95 transition-all cursor-pointer"
            aria-label={isAddDaysMode ? "Back to plan" : "Back to home"}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2
              id="pref-screen-title"
              className="text-[24px] sm:text-[26px] font-serif font-bold text-[#1A1A1A] leading-tight"
            >
              {isAddDaysMode ? "Preferences for Extra Days" : "Your Kitchen"}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#8C857D]">
              {isAddDaysMode
                ? "Configure preferences for the new days to add."
                : "Tailor suggestions to your daily home cooking baseline."}
            </p>
          </div>
        </div>

        {/* Banner indicating existing plan is retained */}
        {isAddDaysMode && (
          <div
            id="pref-add-days-banner"
            className="bg-[#FAF0ED] border border-[#D1654B]/20 rounded-[18px] p-3.5 flex items-start gap-3 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-full bg-[#D1654B] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13.5px] font-bold text-[#1A1A1A]">
                  Adding to Existing Plan
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#D1654B]/30 text-[#D1654B]">
                  {existingPlanLength} {existingPlanLength === 1 ? "day" : "days"} kept
                </span>
              </div>
              <p className="text-[11.5px] text-[#635E58] mt-0.5 leading-snug">
                Your current {existingPlanLength} planned {existingPlanLength === 1 ? "day" : "days"} will be retained.
                These settings will apply to your additional days.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Regional Cuisines */}
        <section className="bg-white border border-[#EBE3D5] rounded-[20px] p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span>What do you usually cook?</span>
              </h3>
              <p className="text-[11px] text-[#8C857D] mt-0.5">
                Select one or more regional culinary styles
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-[#FAF0ED] text-[#D1654B] px-2.5 py-0.5 rounded-full border border-[#D1654B]/20 shrink-0">
              {preferences.cuisines.length} selected
            </span>
          </div>

          {/* Region Tabs & Quick Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {REGION_TABS.map((tab) => {
                const active = regionFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRegionFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-[10px] text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      active
                        ? "bg-[#1A1A1A] text-white shadow-xs"
                        : "bg-[#F3EFE7] text-[#635E58] hover:text-[#1A1A1A] hover:bg-[#EBE3D5]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick helper button */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handleSelectStaples}
                className="text-[11px] font-bold text-[#D1654B] hover:underline cursor-pointer"
              >
                Staples Only
              </button>
              <span className="text-[#D6CEC3] text-[10px]">•</span>
              <button
                type="button"
                onClick={handleSelectAllInView}
                className="text-[11px] font-bold text-[#635E58] hover:text-[#1A1A1A] cursor-pointer"
              >
                + Add {regionFilter === "All" ? "All" : regionFilter}
              </button>
            </div>
          </div>

          {/* Symmetrical 2-Column Cuisines Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {filteredCuisines.map((c) => {
              const isSelected = preferences.cuisines.includes(c.name);
              return (
                <button
                  key={c.name}
                  id={`pref-cuisine-${c.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  type="button"
                  onClick={() => toggleCuisine(c.name)}
                  className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer flex items-center justify-between min-h-[58px] active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#FAF0ED] border-[#D1654B] text-[#1A1A1A] shadow-xs ring-1 ring-[#D1654B]/30"
                      : "bg-[#FDFBF7] border-[#EBE3D5] text-[#2D2823] hover:border-[#D1654B]/40 hover:bg-white"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className={`block text-[13px] font-bold leading-tight truncate ${
                      isSelected ? "text-[#1A1A1A]" : "text-[#2D2823]"
                    }`}>
                      {c.name}
                    </span>
                    <span className="block text-[10px] text-[#8C857D] leading-tight mt-1 truncate">
                      {c.staples}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-[#D1654B] border-[#D1654B] text-white shadow-xs"
                        : "border-[#D6CEC3] bg-[#F7F4EE]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Diet & Cooking Time */}
        <section className="bg-white border border-[#EBE3D5] rounded-[20px] p-4 sm:p-5 shadow-xs space-y-4">
          {/* Dietary preference */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#1A1A1A] block">
              Dietary preference
            </label>
            <div className="grid grid-cols-3 bg-[#F3EFE7] p-1 rounded-[14px] gap-1 border border-[#EBE3D5]">
              {DIETARY_OPTIONS.map((opt) => {
                const active = preferences.dietary === opt;
                return (
                  <button
                    key={opt}
                    id={`pref-diet-${opt.toLowerCase().replace(/[^a-z]/g, "-")}`}
                    type="button"
                    onClick={() => setDietary(opt)}
                    className={`h-[40px] rounded-[10px] text-[13px] font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-white text-[#1A1A1A] shadow-xs"
                        : "text-[#736B63] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#F3EFE7] pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D1654B]" />
                <span>Cooking time preference</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COOKING_TIMES.map((timeOpt) => {
                const active = (preferences.cookingTime || "15–30 mins") === timeOpt;
                return (
                  <button
                    key={timeOpt}
                    id={`pref-cooktime-${timeOpt.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    type="button"
                    onClick={() => setCookingTime(timeOpt)}
                    className={`h-[42px] px-2 rounded-[12px] text-[12px] font-semibold border transition-all text-center flex items-center justify-center cursor-pointer active:scale-[0.98] ${
                      active
                        ? "bg-[#D1654B] text-white border-[#D1654B] shadow-xs"
                        : "bg-[#FDFBF7] border-[#EBE3D5] text-[#2D2823] hover:border-[#D1654B]/30 hover:bg-white"
                    }`}
                  >
                    {timeOpt}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Meal Plan Schedule & Goals */}
        <section className="bg-white border border-[#EBE3D5] rounded-[20px] p-4 sm:p-5 shadow-xs space-y-4">
          {/* Meal types to plan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D1654B]" />
                <span>Meal types to plan</span>
              </label>
              <span className="text-[11px] text-[#8C857D] font-medium">Multi-select</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((m) => {
                const isSelected = currentMealTypes.includes(m.slot);
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.slot}
                    id={`pref-mealtarget-${m.slot}`}
                    type="button"
                    onClick={() => toggleMealType(m.slot)}
                    className={`h-[48px] px-3.5 rounded-[12px] border text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-[#FAF0ED] border-[#D1654B] text-[#D1654B] shadow-xs"
                        : "bg-[#FDFBF7] border-[#EBE3D5] text-[#4A453E] hover:border-[#D1654B]/30 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#D1654B]" : "text-[#8C857D]"}`} />
                      <div className="min-w-0">
                        <span className={`block text-[13px] font-bold leading-none ${isSelected ? "text-[#D1654B]" : "text-[#1A1A1A]"}`}>
                          {m.label}
                        </span>
                        <span className="text-[10px] text-[#8C857D] mt-0.5 block leading-none">
                          {m.sub}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? "bg-[#D1654B] border-[#D1654B] text-white"
                          : "border-[#D6CEC3] bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan duration / Additional days to add */}
          <div className="border-t border-[#F3EFE7] pt-3.5 space-y-2">
            <label className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D1654B]" />
              <span>{isAddDaysMode ? "How many extra days to add?" : "Plan duration"}</span>
            </label>
            {isAddDaysMode ? (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {ADD_DAYS_OPTIONS.map((opt) => {
                  const active = daysToAdd === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`pref-add-days-${opt.value}`}
                      type="button"
                      onClick={() => {
                        setDaysToAdd(opt.value);
                        const dur = opt.value === 1 ? "1 day" : opt.value === 7 ? "1 week" : "3 days";
                        setPlanDuration(dur);
                      }}
                      className={`h-[48px] rounded-[12px] border text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-[#D1654B] text-white border-[#D1654B] shadow-xs"
                          : "bg-[#FDFBF7] border-[#EBE3D5] text-[#2D2823] hover:border-[#D1654B]/30 hover:bg-white"
                      }`}
                    >
                      <span className="text-[13px] font-bold leading-none">{opt.label}</span>
                      <span
                        className={`text-[9.5px] mt-0.5 leading-none truncate px-1 ${
                          active ? "text-white/80" : "text-[#8C857D]"
                        }`}
                      >
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {PLAN_DURATIONS.map((dur) => {
                  const active = (preferences.planDuration || "1 day") === dur.value;
                  return (
                    <button
                      key={dur.value}
                      id={`pref-duration-${dur.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                      type="button"
                      onClick={() => setPlanDuration(dur.value)}
                      className={`h-[46px] rounded-[12px] border text-center transition-all flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-[#D1654B] text-white border-[#D1654B] shadow-xs"
                          : "bg-[#FDFBF7] border-[#EBE3D5] text-[#2D2823] hover:border-[#D1654B]/30 hover:bg-white"
                      }`}
                    >
                      <span className="text-[13px] font-bold leading-none">{dur.label}</span>
                      <span className={`text-[10px] mt-0.5 leading-none ${active ? "text-white/80" : "text-[#8C857D]"}`}>
                        {dur.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily calorie target (Optional) */}
          <div className="border-t border-[#F3EFE7] pt-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#D1654B]" />
                <span>Per day calorie target</span>
              </label>
              <span className="text-[11px] text-[#8C857D] font-medium">Optional</span>
            </div>

            {/* Prominent Full-Width "Flexible" Option */}
            <button
              id="pref-cal-flexible"
              type="button"
              onClick={() => setCalorieGoal("Flexible")}
              className={`w-full p-3 rounded-[14px] border text-left transition-all cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                isFlexibleCalorie
                  ? "bg-[#FAF0ED] border-[#D1654B] ring-1 ring-[#D1654B]/30 shadow-xs"
                  : "bg-[#FDFBF7] border-[#EBE3D5] hover:border-[#D1654B]/40 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                    isFlexibleCalorie
                      ? "bg-[#D1654B] text-white"
                      : "bg-[#F3EFE7] text-[#8C857D]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#1A1A1A]">
                      Flexible
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3EB] text-[#246337]">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C857D] mt-0.5 truncate">
                    No calorie counting • Focus on fresh, balanced home meals
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  isFlexibleCalorie
                    ? "bg-[#D1654B] border-[#D1654B] text-white shadow-xs"
                    : "border-[#D6CEC3] bg-[#F7F4EE]"
                }`}
              >
                {isFlexibleCalorie && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* Symmetrical 2x2 Grid for Specific Numeric Targets */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {SPECIFIC_CALORIE_OPTIONS.map((cal) => {
                const active = preferences.calorieGoal === cal.value;
                return (
                  <button
                    key={cal.value}
                    id={`pref-cal-${cal.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    type="button"
                    onClick={() => setCalorieGoal(cal.value)}
                    className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[62px] active:scale-[0.98] ${
                      active
                        ? "bg-[#FAF0ED] border-[#D1654B] ring-1 ring-[#D1654B]/30 shadow-xs"
                        : "bg-[#FDFBF7] border-[#EBE3D5] hover:border-[#D1654B]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[13px] font-bold ${
                          active ? "text-[#D1654B]" : "text-[#1A1A1A]"
                        }`}
                      >
                        {cal.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          active
                            ? "bg-[#D1654B] border-[#D1654B] text-white"
                            : "border-[#D6CEC3] bg-[#F7F4EE]"
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[5px] ${
                          active
                            ? "bg-[#D1654B] text-white"
                            : "bg-[#F3EFE7] text-[#635E58]"
                        }`}
                      >
                        {cal.badge}
                      </span>
                      <span className="text-[10px] text-[#8C857D] truncate">
                        {cal.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="pt-6 mt-6">
        <button
          id="pref-continue-cta"
          type="button"
          disabled={isSubmitting}
          onClick={async () => {
            if (isAddDaysMode && onAddDays) {
              setIsSubmitting(true);
              try {
                await onAddDays(preferences, daysToAdd);
              } finally {
                setIsSubmitting(false);
              }
            } else {
              onContinue();
            }
          }}
          className="w-full h-[54px] bg-[#D1654B] hover:bg-[#B84E36] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-[#D1654B]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating plan...</span>
            </>
          ) : (
            <span>Create Plan</span>
          )}
        </button>
      </div>
    </div>
  );
}
