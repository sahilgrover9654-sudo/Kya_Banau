import React from "react";
import { DayPlan, MealSlot, Meal } from "../types";
import { ArrowLeftRight, X, Clock, Flame, ArrowDown } from "lucide-react";
import { getMealCalories } from "../utils/nutrition";

interface SwapDishModalProps {
  isOpen: boolean;
  source: {
    dayIndex: number;
    slot: MealSlot;
    meal: Meal;
    dayLabel: string;
  } | null;
  plan: DayPlan[];
  onSwap: (
    source: { dayIndex: number; slot: MealSlot },
    target: { dayIndex: number; slot: MealSlot }
  ) => void;
  onClose: () => void;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export function SwapDishModal({
  isOpen,
  source,
  plan,
  onSwap,
  onClose,
}: SwapDishModalProps) {
  if (!isOpen || !source) return null;

  // Gather all other meals in the plan that can be swapped with
  const availableTargets: Array<{
    dayIndex: number;
    dayLabel: string;
    slot: MealSlot;
    meal: Meal;
    isSameDay: boolean;
  }> = [];

  plan.forEach((dayPlan, dIdx) => {
    const dayLabel = dayPlan.dateStr || dayPlan.day;
    dayPlan.meals.forEach((meal) => {
      const isSelf = dIdx === source.dayIndex && meal.slot === source.slot;
      if (!isSelf) {
        availableTargets.push({
          dayIndex: dIdx,
          dayLabel,
          slot: meal.slot,
          meal,
          isSameDay: dIdx === source.dayIndex,
        });
      }
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FDFBF7] rounded-[24px] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-[#EBE3D5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EBE3D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Swap Dish
              </h3>
              <p className="text-[12px] text-[#8C857D]">
                Swap dishes across your days and meals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Selected Source Meal */}
          <div>
            <span className="text-[11px] font-bold text-[#8C857D] uppercase tracking-wider block mb-1.5">
              Currently Selected
            </span>
            <div className="p-3.5 rounded-[16px] bg-[#FAF0ED] border border-[#D1654B]/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#D1654B]">
                <span>{source.dayLabel}</span>
                <span className="uppercase tracking-wide">
                  {SLOT_LABELS[source.slot]}
                </span>
              </div>
              <p className="text-[15px] font-bold text-[#1A1A1A]">
                {source.meal.dish}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#635E58]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8C857D]" />
                  {source.meal.cookTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#D1654B]" />
                  {getMealCalories(source.meal)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-center justify-center text-[12px] font-medium text-[#8C857D]">
            <ArrowDown className="w-3.5 h-3.5 text-[#D1654B]" />
            <span>Select a meal to swap with</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#D1654B]" />
          </div>

          {/* Target options */}
          {availableTargets.length === 0 ? (
            <div className="text-center py-6 px-4 bg-white rounded-[16px] border border-[#EBE3D5]">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                Only 1 meal planned right now
              </p>
              <p className="text-xs text-[#8C857D] mt-1">
                Add more meals (like Breakfast/Lunch) or plan more days to swap dishes between days.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {availableTargets.map((target) => (
                <div
                  key={`${target.dayIndex}-${target.slot}`}
                  className="p-3.5 bg-white border border-[#EBE3D5] hover:border-[#D1654B]/50 rounded-[16px] shadow-xs flex items-center justify-between gap-3 transition-all hover:bg-[#FFFDFB]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold text-[#1A1A1A]">
                        {target.dayLabel}
                      </span>
                      <span className="text-[10px] font-bold bg-[#F3EFE7] text-[#D1654B] px-2 py-0.5 rounded-full uppercase tracking-tight">
                        {SLOT_LABELS[target.slot]}
                      </span>
                      {target.isSameDay && (
                        <span className="text-[10px] font-semibold text-[#2B6A42] bg-[#E8F3EB] px-1.5 py-0.5 rounded-md">
                          Same Day
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-semibold text-[#1A1A1A] truncate">
                      {target.meal.dish}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#8C857D] mt-0.5">
                      <span>{target.meal.cookTime}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-[#D1654B]" />
                        {getMealCalories(target.meal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSwap(
                        { dayIndex: source.dayIndex, slot: source.slot },
                        { dayIndex: target.dayIndex, slot: target.slot }
                      );
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-[#D1654B] hover:bg-[#B84E36] text-white rounded-[12px] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 shadow-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Swap</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBE3D5] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-[12px] border border-[#EBE3D5] text-[#635E58] hover:text-[#1A1A1A] font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
