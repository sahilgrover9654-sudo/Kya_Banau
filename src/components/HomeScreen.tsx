import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Clock, Sparkles, CheckCircle2, CookingPot, User, LogIn } from "lucide-react";
import { UserProfile } from "../types";

interface HomeScreenProps {
  onPlanMeals: () => void;
  onQuickSuggest: () => void;
  hasExistingPlan?: boolean;
  onViewExistingPlan?: () => void;
  user?: UserProfile | null;
  onOpenProfile: () => void;
}

const PREVIEW_DISHES = [
  {
    slot: "MONDAY · BREAKFAST",
    dish: "Kanda Poha with Peanuts",
    cookTime: "15 min",
    tag: "Quick morning",
    why: "Light, fluffy, and ready in under 15 minutes before your first call.",
  },
  {
    slot: "TUESDAY · LUNCH",
    dish: "Homestyle Dal Tadka & Jeera Rice",
    cookTime: "20 min",
    tag: "Comfort classic",
    why: "Pantry staples, gentle on the stomach, zero afternoon slump.",
  },
  {
    slot: "WEDNESDAY · DINNER",
    dish: "Quick Paneer Bhurji & Phulkas",
    cookTime: "20 min",
    tag: "High protein",
    why: "One-pan cooking with tomatoes and fresh coriander. Easy cleanup.",
  },
];

export function HomeScreen({
  onPlanMeals,
  onQuickSuggest,
  hasExistingPlan = false,
  onViewExistingPlan,
  user = null,
  onOpenProfile,
}: HomeScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-swipe horizontally every 3.2 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PREVIEW_DISHES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      if (diff > 40) {
        // swipe left -> next
        setActiveIndex((prev) => (prev + 1) % PREVIEW_DISHES.length);
      } else if (diff < -40) {
        // swipe right -> prev
        setActiveIndex((prev) => (prev - 1 + PREVIEW_DISHES.length) % PREVIEW_DISHES.length);
      }
    }
    touchStartX.current = null;
    // Resume auto-swipe after brief delay
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full justify-between items-center text-center pb-8 pt-6 px-6 relative overflow-hidden">
      {/* Background subtle ambient warm glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-b from-[#FAF0E6]/90 via-[#F3EFE7]/50 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header: Main brand title on the left, Sign in or User Profile on the right */}
      <header className="w-full flex items-center justify-between shrink-0 mb-3 z-10">
        <div className="inline-flex items-center gap-2 select-none text-left">
          <CookingPot className="w-5 h-5 text-[#D1654B] shrink-0" />
          <span className="text-[17px] font-black tracking-tight uppercase select-none leading-none">
            <span className="text-[#D1654B]">KYA</span>{" "}
            <span className="text-[#1A1A1A]">BANAU?</span>
          </span>
        </div>

        {/* Top Right: User Profile badge when signed in, or Sign in button when not */}
        {user ? (
          <button
            id="home-profile-btn"
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 bg-white hover:bg-[#FAF0ED]/50 border border-[#EBE3D5] hover:border-[#D1654B]/40 pl-1.5 pr-3 py-1 rounded-full shadow-2xs cursor-pointer transition-all active:scale-95"
            title={`${user.name}'s Profile`}
            aria-label={`${user.name}'s Profile`}
          >
            {user.avatar && user.avatar.startsWith("http") && !user.avatar.includes("dicebear") ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#D1654B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[13px] font-semibold text-[#1A1A1A] max-w-[110px] truncate">
              {user.name}
            </span>
          </button>
        ) : (
          <button
            id="home-signin-btn"
            type="button"
            onClick={onOpenProfile}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF0ED]/60 border border-[#EBE3D5] hover:border-[#D1654B]/50 text-[#1A1A1A] hover:text-[#D1654B] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Sign in"
            aria-label="Sign in"
          >
            <LogIn className="w-3.5 h-3.5 text-[#D1654B]" />
            <span>Sign in</span>
          </button>
        )}
      </header>

      {/* Middle Section: Hero text + 3 Auto-Swiping Cards brought into the vertical center */}
      <div className="w-full my-auto py-4 flex flex-col items-center justify-center space-y-5">
        {/* Main Display Headline & Tagline */}
        <div className="flex flex-col items-center text-center px-2">
          <h1
            id="home-app-title"
            className="text-[38px] sm:text-[42px] font-serif font-black text-[#1A1A1A] leading-[1.08] tracking-tight text-center mb-2.5"
          >
            Cooking is easy.<br />
            Deciding isn't.
          </h1>

          <p
            id="home-tagline"
            className="text-[15px] sm:text-[16px] text-[#635E58] text-center max-w-[320px] mx-auto leading-relaxed font-normal"
          >
            Never stare into the fridge wondering what to make. Get your week sorted with simple, realistic weekday meals.
          </p>
        </div>

        {/* 3 Cards Horizontal Auto-Swiping Carousel */}
        <div
          className="w-full max-w-[340px] relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Ambient backlight glow */}
          <div className="absolute -inset-1 bg-gradient-to-b from-[#D1654B]/12 via-[#E8A575]/15 to-transparent rounded-[28px] blur-xl opacity-80 pointer-events-none" />

          {/* Carousel Viewport */}
          <div className="relative overflow-hidden rounded-[24px] border border-[#EBE3D5] bg-white shadow-[0_12px_32px_rgba(209,101,75,0.08)]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {PREVIEW_DISHES.map((item, index) => (
                <div
                  key={index}
                  className="w-full shrink-0 p-5 space-y-3.5 text-center flex flex-col items-center justify-between min-h-[210px]"
                >
                  {/* Slot pill with pulse indicator */}
                  <div className="w-full flex items-center justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D1654B] inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D1654B] animate-pulse" />
                      <span>{item.slot}</span>
                    </span>
                  </div>

                  {/* Dish Name */}
                  <div className="w-full px-1">
                    <h3 className="text-[20px] font-serif font-bold text-[#1A1A1A] leading-tight text-center">
                      {item.dish}
                    </h3>
                  </div>

                  {/* Meta Chips */}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#635E58] bg-[#F3EFE7] px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-[#635E58]" />
                      <span>{item.cookTime}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D1654B] bg-[#FAF0ED] border border-[#D1654B]/20 px-3 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-[#D1654B]" />
                      <span>{item.tag}</span>
                    </span>
                  </div>

                  {/* Contextual Prep Note */}
                  <p className="text-[12.5px] italic text-[#8C857D] text-center leading-snug pt-2 border-t border-[#F3EFE7] w-full max-w-[290px]">
                    "{item.why}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-2 pt-3">
            {PREVIEW_DISHES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => {
                  setActiveIndex(dotIdx);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 3000);
                }}
                aria-label={`Go to meal preview ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  dotIdx === activeIndex
                    ? "w-6 h-1.5 bg-[#D1654B]"
                    : "w-1.5 h-1.5 bg-[#D9D0C1] hover:bg-[#D1654B]/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Existing Plan Notice if user has an active plan */}
        {hasExistingPlan && onViewExistingPlan && (
          <button
            id="home-view-existing-plan-btn"
            onClick={onViewExistingPlan}
            className="w-full max-w-[340px] py-3 px-4 rounded-[16px] bg-white border border-[#EBE3D5] text-[#1A1A1A] text-xs font-semibold flex items-center justify-between shadow-xs hover:border-[#D1654B] transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2B6A42]" />
              <span>You have an active meal plan</span>
            </span>
            <span className="font-bold text-[#D1654B] flex items-center gap-1">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </div>

      {/* Bottom CTAs: Anchored in thumb zone and center-aligned */}
      <div className="w-full space-y-3 pt-2 mt-auto flex flex-col items-center">
        <button
          id="home-plan-meals-cta"
          onClick={onPlanMeals}
          className="w-full h-[58px] bg-[#D1654B] text-white rounded-[20px] font-bold text-[16px] shadow-xl shadow-[#D1654B]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-[#C2583F]"
        >
          <span>Plan My Week's Meals</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          id="home-quick-suggest-cta"
          onClick={onQuickSuggest}
          className="w-full h-[50px] bg-white border border-[#EBE3D5] hover:border-[#D1654B] text-[#1A1A1A] hover:text-[#D1654B] rounded-[18px] font-semibold text-[14px] shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Suggest Something Quickly</span>
        </button>
      </div>
    </div>
  );
}
