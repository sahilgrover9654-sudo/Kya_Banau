import React, { useState, useEffect } from "react";
import { Sparkles, Utensils, ChefHat, CookingPot, Flame } from "lucide-react";

export function MealRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#F3EFE7] last:border-0 animate-pulse">
      <div className="flex-1 pr-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-16 bg-[#EBE3D5] rounded"></div>
          <div className="h-4 w-32 bg-[#DFD6C7] rounded"></div>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-4 w-14 bg-[#F3EFE7] rounded-full"></div>
          <div className="h-4 w-16 bg-[#F3EFE7] rounded-full"></div>
        </div>
        <div className="h-3 w-44 bg-[#EBE3D5] rounded"></div>
      </div>
      <div className="w-12 h-12 rounded-full bg-[#F3EFE7] border border-[#EBE3D5]"></div>
    </div>
  );
}

export function PlanLoadingCard({ message = "Delicious food suggestions underway..." }: { message?: string }) {
  const hints = [
    "Balancing quick prep times with authentic home taste...",
    "Curating realistic, low-effort weekday meals...",
    "Checking spice pairings and ingredients...",
    "Almost ready to serve your meal plan...",
  ];

  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [hints.length]);

  return (
    <div className="space-y-4">
      {/* Engaging Appetizing Loading Notice */}
      <div
        id="card-loading-status-banner"
        className="p-5 rounded-[22px] bg-gradient-to-br from-[#FFF8EE] to-[#FAF0ED] border border-[#FDE3B8] shadow-sm text-center flex flex-col items-center justify-center space-y-2.5 animate-in fade-in"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs text-[#D1654B] flex items-center justify-center animate-bounce">
            <CookingPot className="w-6 h-6" />
          </div>
          <Sparkles className="w-4 h-4 text-[#D97706] absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div>
          <h3 className="text-[16px] font-serif font-bold text-[#1A1A1A]">
            {message}
          </h3>
          <p className="text-[12px] text-[#635E58] mt-1 font-medium transition-all duration-300">
            {hints[hintIndex]}
          </p>
        </div>
      </div>

      {/* Shimmer Placeholder Cards */}
      <DayPlanSkeleton showHeader={false} />
      <DayPlanSkeleton showHeader={false} />
    </div>
  );
}

export function DayPlanSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="bg-white border border-[#EBE3D5] rounded-[20px] p-4 mb-4 shadow-xs">
      {showHeader && (
        <div className="h-5 w-24 bg-[#EBE3D5] rounded mb-3 animate-pulse"></div>
      )}
      <div className="divide-y divide-[#F3EFE7]">
        <MealRowSkeleton />
        <MealRowSkeleton />
        <MealRowSkeleton />
      </div>
    </div>
  );
}

export function CalibrateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-[18px] bg-[#FAF0ED] border border-[#F3D7D0] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white text-[#D1654B] flex items-center justify-center shrink-0 shadow-xs">
          <ChefHat className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1A1A1A]">
            Delicious food suggestions underway...
          </h4>
          <p className="text-[11px] text-[#635E58]">
            Loading popular dishes you might already know how to make.
          </p>
        </div>
      </div>

      <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map((section) => (
          <div key={section}>
            <div className="h-5 w-28 bg-[#DFD6C7] rounded mb-2"></div>
            <div className="h-3.5 w-56 bg-[#EBE3D5] rounded mb-3"></div>
            <div className="grid grid-cols-1 gap-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-13 bg-white border border-[#EBE3D5] rounded-[16px]"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickSuggestSkeleton() {
  return (
    <div
      id="quick-suggest-loading-card"
      className="bg-white border border-[#EBE3D5] rounded-[20px] p-5 shadow-xs space-y-4"
    >
      {/* Delicious Food Suggestion Underway Status */}
      <div className="p-3.5 rounded-[16px] bg-[#FAF0ED] border border-[#F3D7D0] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white text-[#D1654B] flex items-center justify-center shrink-0 shadow-xs">
          <Utensils className="w-4 h-4 animate-bounce" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
            Delicious food suggestion is underway...
          </h4>
          <p className="text-[11px] text-[#635E58] truncate">
            Checking flavor combos with your kitchen ingredients
          </p>
        </div>
      </div>

      {/* Shimmer Structure */}
      <div className="animate-pulse space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-[#EBE3D5] rounded"></div>
          <div className="h-5 w-16 bg-[#F3EFE7] rounded-full"></div>
        </div>
        <div className="h-6 w-52 bg-[#DFD6C7] rounded"></div>
        <div className="h-4 w-full bg-[#EBE3D5] rounded"></div>
        <div className="pt-2 border-t border-[#F3EFE7] flex gap-2">
          <div className="h-5 w-16 bg-[#F3EFE7] rounded-full"></div>
          <div className="h-5 w-16 bg-[#F3EFE7] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
