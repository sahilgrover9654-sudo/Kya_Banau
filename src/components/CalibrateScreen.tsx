import React, { useState, useEffect } from "react";
import { UserPreferences } from "../types";
import { fetchCalibrateDishes, CalibrateResponse } from "../utils/api";
import { CalibrateSkeleton } from "./SkeletonLoader";
import { Check, ChevronLeft } from "lucide-react";

interface CalibrateScreenProps {
  preferences: UserPreferences;
  onComplete: (selectedDishes: string[]) => void;
  onSkip: () => void;
  onBackToHome?: () => void;
}

export function CalibrateScreen({
  preferences,
  onComplete,
  onSkip,
  onBackToHome,
}: CalibrateScreenProps) {
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<CalibrateResponse>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
  });

  const [selectedBreakfast, setSelectedBreakfast] = useState<string[]>([]);
  const [selectedLunch, setSelectedLunch] = useState<string[]>([]);
  const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);
  const [selectedDinner, setSelectedDinner] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDishes() {
      setLoading(true);
      const data = await fetchCalibrateDishes(preferences);
      if (isMounted) {
        setDishes(data);
        setLoading(false);
      }
    }
    loadDishes();
    return () => {
      isMounted = false;
    };
  }, [preferences]);

  const toggleItem = (
    item: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  // Always require preferences across all 4 meal categories: breakfast, lunch, snacks, dinner
  const isBreakfastValid = selectedBreakfast.length >= 1;
  const isLunchValid = selectedLunch.length >= 1;
  const isSnacksValid = selectedSnacks.length >= 1;
  const isDinnerValid = selectedDinner.length >= 1;

  const completedSections =
    (isBreakfastValid ? 1 : 0) +
    (isLunchValid ? 1 : 0) +
    (isSnacksValid ? 1 : 0) +
    (isDinnerValid ? 1 : 0);

  const canContinue = completedSections === 4;

  const handleContinue = () => {
    const allSelected = [
      ...selectedBreakfast,
      ...selectedLunch,
      ...selectedSnacks,
      ...selectedDinner,
    ];
    onComplete(allSelected);
  };

  // Progress computation: 0% -> 100% across all 4 meal types
  const progressPercent = Math.round((completedSections / 4) * 100);

  return (
    <div className="flex flex-col min-h-full pb-28 pt-3 px-6">
      {/* Top Back navigation */}
      {onBackToHome && (
        <div className="flex items-center justify-between mb-2">
          <button
            id="calibrate-back-home-btn"
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#635E58] hover:text-[#1A1A1A] py-1 px-2.5 -ml-2 rounded-full hover:bg-[#F3EFE7] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {/* Thin progress bar at top */}
      <div className="w-full bg-[#EBE3D5] h-1.5 rounded-full mb-4 overflow-hidden">
        <div
          className="bg-[#D1654B] h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.max(15, progressPercent)}%` }}
        />
      </div>

      {/* Header with Skip link */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 id="calibrate-title" className="text-[28px] font-serif font-bold text-[#1A1A1A] leading-tight">
            First, tell us your preferences
          </h2>
          <p id="calibrate-subtext" className="text-[13px] text-[#8C857D] mt-1">
            One-time taste calibration across all 4 meals. After this, we learn from what you cook and swap.
          </p>
        </div>
        <button
          id="calibrate-skip-btn"
          type="button"
          onClick={onSkip}
          className="text-xs font-bold text-[#8C857D] hover:text-[#1A1A1A] p-2 min-h-[48px] -mr-2"
        >
          Skip
        </button>
      </div>

      {loading ? (
        <div className="py-4">
          <p className="text-xs text-[#8C857D] mb-4 italic">
            Calibrating dishes based on {preferences.cuisines.join(", ")}...
          </p>
          <CalibrateSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Breakfast */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[12px] font-bold text-[#D1654B] uppercase tracking-tight">
                Breakfast
              </h3>
              <span className={`text-xs font-semibold ${isBreakfastValid ? "text-[#2B6A42]" : "text-[#8C857D]"}`}>
                {selectedBreakfast.length} picked
              </span>
            </div>
            <p className="text-[12px] text-[#8C857D] italic">
              Which of these would you actually cook on a weekday morning?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {dishes.breakfast.map((dish) => {
                const selected = selectedBreakfast.includes(dish);
                return (
                  <button
                    key={dish}
                    type="button"
                    onClick={() =>
                      toggleItem(dish, selectedBreakfast, setSelectedBreakfast)
                    }
                    className={`min-h-[50px] px-4 py-3 rounded-[16px] text-left text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? "bg-[#D1654B] text-white shadow-sm border border-[#D1654B]"
                        : "bg-white border border-[#EBE3D5] text-[#1A1A1A] active:bg-[#F3EFE7] shadow-xs"
                    }`}
                  >
                    <span>{dish}</span>
                    {selected && <Check className="w-4 h-4 text-[#FFFFFF] shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Lunch */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[12px] font-bold text-[#D1654B] uppercase tracking-tight">
                Lunch
              </h3>
              <span className={`text-xs font-semibold ${isLunchValid ? "text-[#2B6A42]" : "text-[#8C857D]"}`}>
                {selectedLunch.length} picked
              </span>
            </div>
            <p className="text-[12px] text-[#8C857D] italic">
              Simple everyday lunch options:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {dishes.lunch.map((dish) => {
                const selected = selectedLunch.includes(dish);
                return (
                  <button
                    key={dish}
                    type="button"
                    onClick={() =>
                      toggleItem(dish, selectedLunch, setSelectedLunch)
                    }
                    className={`min-h-[50px] px-4 py-3 rounded-[16px] text-left text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? "bg-[#D1654B] text-white shadow-sm border border-[#D1654B]"
                        : "bg-white border border-[#EBE3D5] text-[#1A1A1A] active:bg-[#F3EFE7] shadow-xs"
                    }`}
                  >
                    <span>{dish}</span>
                    {selected && <Check className="w-4 h-4 text-[#FFFFFF] shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Snacks */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[12px] font-bold text-[#D1654B] uppercase tracking-tight">
                Snacks
              </h3>
              <span className={`text-xs font-semibold ${isSnacksValid ? "text-[#2B6A42]" : "text-[#8C857D]"}`}>
                {selectedSnacks.length} picked
              </span>
            </div>
            <p className="text-[12px] text-[#8C857D] italic">
              Evening snacks & 5-minute chai companions:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(dishes.snacks || []).map((dish) => {
                const selected = selectedSnacks.includes(dish);
                return (
                  <button
                    key={dish}
                    type="button"
                    onClick={() =>
                      toggleItem(dish, selectedSnacks, setSelectedSnacks)
                    }
                    className={`min-h-[50px] px-4 py-3 rounded-[16px] text-left text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? "bg-[#D1654B] text-white shadow-sm border border-[#D1654B]"
                        : "bg-white border border-[#EBE3D5] text-[#1A1A1A] active:bg-[#F3EFE7] shadow-xs"
                    }`}
                  >
                    <span>{dish}</span>
                    {selected && <Check className="w-4 h-4 text-[#FFFFFF] shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Dinner */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[12px] font-bold text-[#D1654B] uppercase tracking-tight">
                Dinner
              </h3>
              <span className={`text-xs font-semibold ${isDinnerValid ? "text-[#2B6A42]" : "text-[#8C857D]"}`}>
                {selectedDinner.length} picked
              </span>
            </div>
            <p className="text-[12px] text-[#8C857D] italic">
              Evening comforts after work:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {dishes.dinner.map((dish) => {
                const selected = selectedDinner.includes(dish);
                return (
                  <button
                    key={dish}
                    type="button"
                    onClick={() =>
                      toggleItem(dish, selectedDinner, setSelectedDinner)
                    }
                    className={`min-h-[50px] px-4 py-3 rounded-[16px] text-left text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? "bg-[#D1654B] text-white shadow-sm border border-[#D1654B]"
                        : "bg-white border border-[#EBE3D5] text-[#1A1A1A] active:bg-[#F3EFE7] shadow-xs"
                    }`}
                  >
                    <span>{dish}</span>
                    {selected && <Check className="w-4 h-4 text-[#FFFFFF] shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom fixed container for Continue */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent z-10">
        <button
          id="calibrate-continue-cta"
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={`w-full h-[56px] px-5 rounded-[16px] font-bold text-[16px] shadow-lg transition-all flex items-center justify-center ${
            canContinue
              ? "bg-[#D1654B] text-[#FFFFFF] shadow-[#D1654B]/25 active:scale-[0.98]"
              : "bg-[#EBE3D5] text-[#8C857D] cursor-not-allowed shadow-none"
          }`}
        >
          {canContinue
            ? "Generate My Plan"
            : `Pick at least 1 per section (${completedSections}/4)`}
        </button>
      </div>
    </div>
  );
}
