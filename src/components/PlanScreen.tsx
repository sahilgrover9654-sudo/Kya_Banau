import React, { useState, useEffect } from "react";
import { DayPlan, MealSlot, Meal, UserPreferences } from "../types";
import {
  RefreshCw,
  Plus,
  Clock,
  Flame,
  Sparkles,
  BookOpen,
  ChevronLeft,
  Home,
  ArrowLeftRight,
  Trash2,
  UtensilsCrossed,
  Pencil,
} from "lucide-react";
import { swapDishApi, generatePlanApi, CLIENT_FALLBACK_TEMPLATES } from "../utils/api";
import { addStoredSwappedDish, getStoredSwappedDishes } from "../utils/storage";
import { formatDayWithDate } from "../utils/dates";
import { getMealCalories } from "../utils/nutrition";
import {
  logEvent,
  classifyError,
  getSessionRegenerateCount,
  incrementSessionRegenerateCount,
} from "../utils/events";
import { DayPlanSkeleton, PlanLoadingCard } from "./SkeletonLoader";
import { RecipeModal } from "./RecipeModal";
import { SwapDishModal } from "./SwapDishModal";
import { EditDishModal } from "./EditDishModal";
import { PlanMoreDaysModal } from "./PlanMoreDaysModal";

interface PlanScreenProps {
  plan: DayPlan[];
  preferences: UserPreferences;
  dishesMade: string[];
  onUpdatePlan: (updated: DayPlan[]) => void;
  onLockPlan: () => void;
  onEditPreferences: () => void;
  onShowToast: (msg: string) => void;
  swapCount: number;
  onIncrementSwap: () => void;
  loadingInitial?: boolean;
  onBackToHome?: () => void;
  isLocked?: boolean;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export function PlanScreen({
  plan,
  preferences,
  dishesMade,
  onUpdatePlan,
  onLockPlan,
  onEditPreferences,
  onShowToast,
  swapCount,
  onIncrementSwap,
  loadingInitial = false,
  onBackToHome,
  isLocked = false,
}: PlanScreenProps) {
  const [swappingKey, setSwappingKey] = useState<string | null>(null);
  const [addingDays, setAddingDays] = useState(false);
  const [isPlanMoreModalOpen, setIsPlanMoreModalOpen] = useState(false);
  const [recipeDish, setRecipeDish] = useState<{
    dish: string;
    cookTime?: string;
    preloadedRecipe?: any;
  } | null>(null);
  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number;
    meal: Meal;
    dayLabel: string;
  } | null>(null);
  const [swapSource, setSwapSource] = useState<{
    dayIndex: number;
    slot: MealSlot;
    meal: Meal;
    dayLabel: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "meal" | "day";
    dayIndex: number;
    slot?: MealSlot;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Auto-heal empty days if any corrupted plan data is present
  useEffect(() => {
    let hasEmptyDay = false;
    const activeSlots: MealSlot[] =
      preferences.mealTypes && preferences.mealTypes.length > 0
        ? preferences.mealTypes
        : ["dinner"];

    const healedPlan = plan.map((dayPlan, dayIndex) => {
      if (!dayPlan.meals || dayPlan.meals.length === 0) {
        hasEmptyDay = true;
        const templateIndex = dayIndex % CLIENT_FALLBACK_TEMPLATES.length;
        const template = CLIENT_FALLBACK_TEMPLATES[templateIndex];
        return {
          ...dayPlan,
          meals: activeSlots.map((slot) => ({ ...template[slot] })),
        };
      }
      return dayPlan;
    });

    if (hasEmptyDay) {
      onUpdatePlan(healedPlan);
    }
  }, [plan, preferences.mealTypes, onUpdatePlan]);

  const handleHealSingleDay = (dayIndex: number) => {
    const activeSlots: MealSlot[] =
      preferences.mealTypes && preferences.mealTypes.length > 0
        ? preferences.mealTypes
        : ["dinner"];
    const templateIndex = dayIndex % CLIENT_FALLBACK_TEMPLATES.length;
    const template = CLIENT_FALLBACK_TEMPLATES[templateIndex];
    const newMeals = activeSlots.map((slot) => ({ ...template[slot] }));
    const newPlan = plan.map((d, i) => (i === dayIndex ? { ...d, meals: newMeals } : d));
    onUpdatePlan(newPlan);
    onShowToast("Added fresh meals for this day! 🍲");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "day") {
      handleDeleteDay(deleteTarget.dayIndex, deleteTarget.title);
    } else if (deleteTarget.type === "meal" && deleteTarget.slot) {
      handleDeleteMeal(deleteTarget.dayIndex, deleteTarget.slot, deleteTarget.title);
    }
    setDeleteTarget(null);
  };

  const handleMealEdited = (updatedMeal: Meal) => {
    if (!editingMeal) return;
    const newPlan = plan.map((day, dIdx) => {
      if (dIdx !== editingMeal.dayIndex) return day;
      return {
        ...day,
        meals: day.meals.map((m) => (m.slot === updatedMeal.slot ? updatedMeal : m)),
      };
    });
    onUpdatePlan(newPlan);
    onShowToast(`Updated to ${updatedMeal.dish}! Recipe is ready.`);
  };

  // All current dishes in plan + previously swapped dishes
  const getAllCurrentDishes = (): string[] => {
    const fromPlan = plan.flatMap((day) => day.meals.map((m) => m.dish));
    const fromSwapped = getStoredSwappedDishes();
    return Array.from(new Set([...fromPlan, ...fromSwapped]));
  };

  const handleExecuteSwap = (
    source: { dayIndex: number; slot: MealSlot },
    target: { dayIndex: number; slot: MealSlot }
  ) => {
    const nextPlan = [...plan];
    const sourceDayMeals = [...nextPlan[source.dayIndex].meals];
    const targetDayMeals =
      source.dayIndex === target.dayIndex
        ? sourceDayMeals
        : [...nextPlan[target.dayIndex].meals];

    const sIdx = sourceDayMeals.findIndex((m) => m.slot === source.slot);
    const tIdx = targetDayMeals.findIndex((m) => m.slot === target.slot);

    if (sIdx === -1 || tIdx === -1) return;

    const sourceMeal = sourceDayMeals[sIdx];
    const targetMeal = targetDayMeals[tIdx];

    const newSourceMeal = {
      ...sourceMeal,
      dish: targetMeal.dish,
      cookTime: targetMeal.cookTime,
      why: targetMeal.why,
      tag: targetMeal.tag,
      completed: false,
    };

    const newTargetMeal = {
      ...targetMeal,
      dish: sourceMeal.dish,
      cookTime: sourceMeal.cookTime,
      why: sourceMeal.why,
      tag: sourceMeal.tag,
      completed: false,
    };

    if (source.dayIndex === target.dayIndex) {
      sourceDayMeals[sIdx] = newSourceMeal;
      sourceDayMeals[tIdx] = newTargetMeal;
      nextPlan[source.dayIndex] = {
        ...nextPlan[source.dayIndex],
        meals: sourceDayMeals,
      };
    } else {
      sourceDayMeals[sIdx] = newSourceMeal;
      targetDayMeals[tIdx] = newTargetMeal;
      nextPlan[source.dayIndex] = {
        ...nextPlan[source.dayIndex],
        meals: sourceDayMeals,
      };
      nextPlan[target.dayIndex] = {
        ...nextPlan[target.dayIndex],
        meals: targetDayMeals,
      };
    }

    onUpdatePlan(nextPlan);
    onShowToast(`Swapped "${sourceMeal.dish}" with "${targetMeal.dish}" 🔄`);
  };

  const handleSwap = async (dayIndex: number, slot: MealSlot) => {
    const currentMeal = plan[dayIndex]?.meals.find((m) => m.slot === slot);
    if (!currentMeal) return;

    const swapKey = `${dayIndex}-${slot}`;
    setSwappingKey(swapKey);

    // Save swapped out dish
    addStoredSwappedDish(currentMeal.dish);
    const exclude = getAllCurrentDishes();

    try {
      const newMeal = await swapDishApi(
        slot,
        currentMeal.dish,
        preferences,
        exclude,
        dishesMade
      );

      const nextPlan = [...plan];
      const dayMeals = [...nextPlan[dayIndex].meals];
      const mealIdx = dayMeals.findIndex((m) => m.slot === slot);
      if (mealIdx !== -1) {
        dayMeals[mealIdx] = newMeal;
        nextPlan[dayIndex] = {
          ...nextPlan[dayIndex],
          meals: dayMeals,
        };
        onUpdatePlan(nextPlan);
      }

      onIncrementSwap();
      // "After a second swap in the same session, show a small toast: 'Noted — we won't suggest that again.'"
      if (swapCount + 1 >= 2) {
        onShowToast("Noted — we won't suggest that again.");
      }
    } catch (err) {
      console.error("Swap error:", err);
    } finally {
      setSwappingKey(null);
    }
  };

  const handleAddExtraDays = async (numDays: number = 2) => {
    if (addingDays) return;
    const daysToAdd = Math.max(1, numDays);
    setAddingDays(true);

    const exclude = getAllCurrentDishes();
    const startTime = performance.now();
    const inputText = `${(preferences.cuisines || []).join(", ")} | ${preferences.dietary || ""} | ${preferences.cookingTime || ""}`.trim();
    const currentRegenCount = getSessionRegenerateCount();

    try {
      const moreDays = await generatePlanApi(
        preferences,
        dishesMade,
        daysToAdd,
        exclude,
        plan.length
      );

      const updatedPlan = [...plan, ...moreDays];
      onUpdatePlan(updatedPlan);
      onShowToast(`Added ${daysToAdd} extra day${daysToAdd > 1 ? "s" : ""} on top of your plan! 🎉`);

      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        logEvent("weekly_plan_generate", {
          latency_ms: latency,
          plan_days: updatedPlan.length,
          input_text: inputText,
          regenerate_count: currentRegenCount,
        });
        incrementSessionRegenerateCount();
      });
    } catch (err: any) {
      console.error("Add days error:", err);
      const latency = performance.now() - startTime;
      logEvent("weekly_plan_failed", {
        latency_ms: latency,
        plan_days: daysToAdd,
        input_text: inputText,
        regenerate_count: currentRegenCount,
        error_type: classifyError(err),
      });
    } finally {
      setAddingDays(false);
    }
  };

  const handleDeleteDay = (dayIndex: number, dayLabel: string) => {
    const nextPlan = plan.filter((_, idx) => idx !== dayIndex);
    onUpdatePlan(nextPlan);
    onShowToast(`Deleted plan for ${dayLabel} 🗑️`);
  };

  const handleDeleteMeal = (dayIndex: number, slot: MealSlot, dishName: string) => {
    const nextPlan = [...plan];
    const targetDay = nextPlan[dayIndex];
    if (!targetDay) return;

    const remainingMeals = targetDay.meals.filter((m) => m.slot !== slot);
    if (remainingMeals.length === 0) {
      nextPlan.splice(dayIndex, 1);
      onShowToast(`Removed ${dishName} and cleared day 🗑️`);
    } else {
      nextPlan[dayIndex] = {
        ...targetDay,
        meals: remainingMeals,
      };
      onShowToast(`Removed ${dishName} 🗑️`);
    }
    onUpdatePlan(nextPlan);
  };

  const headerTitle =
    plan.length === 1
      ? "Your 1-day plan"
      : plan.length === 7
      ? "Your 1-week plan"
      : `Your next ${plan.length} days`;

  return (
    <div className={`flex flex-col flex-1 min-h-full ${plan.length === 0 ? "pb-6" : "pb-36"} pt-4 px-6`}>
      {/* Top Navigation Bar: Back to Home */}
      <div className="flex items-center justify-between mb-3">
        <button
          id="plan-back-home-btn"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#635E58] hover:text-[#1A1A1A] py-1.5 px-2.5 -ml-2 rounded-full hover:bg-[#F3EFE7] transition-colors"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors"
            title="Go to Home"
          >
            <Home className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        {plan.length > 0 && (
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <p className="text-[#D1654B] font-medium text-[13px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{headerTitle}</span>
            </p>
            {preferences.calorieGoal && preferences.calorieGoal !== "Flexible" && (
              <span className="text-[11px] font-semibold bg-[#FAF0ED] text-[#D1654B] px-2.5 py-0.5 rounded-full border border-[#D1654B]/20">
                {preferences.calorieGoal}/day
              </span>
            )}
          </div>
        )}
        <h2 id="plan-screen-title" className="text-[30px] font-serif font-bold text-[#1A1A1A] leading-tight">
          {plan.length === 0 ? "Kya Banao" : "Yeh Banao"}
        </h2>
        <p className="text-[12px] text-[#8C857D] mt-1">
          {plan.length > 0
            ? "Rotate for a fresh alternative, or tap swap to exchange dishes across days."
            : "Plan meals easily with simple, comforting weekday dishes."}
        </p>
      </div>

      {loadingInitial || (addingDays && plan.length === 0) ? (
        <PlanLoadingCard message="Delicious food suggestions underway..." />
      ) : plan.length === 0 ? (
        <div className="flex-1 flex flex-col justify-between my-2">
          <div className="bg-white border border-[#EBE3D5] rounded-[24px] p-8 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">No meals in your plan</h3>
              <p className="text-[13px] text-[#8C857D] leading-relaxed max-w-xs mx-auto">
                You've cleared all planned meals. Generate a new plan for fresh suggestions
              </p>
            </div>
          </div>

          {/* Bottom-anchored CTA button to fill the page evenly */}
          <div className="pt-8 pb-4">
            <button
              id="plan-generate-cta"
              type="button"
              onClick={() => handleAddExtraDays(3)}
              disabled={addingDays}
              className="w-full h-[56px] rounded-[16px] bg-[#D1654B] hover:bg-[#B84E36] text-white font-bold text-[16px] shadow-lg shadow-[#D1654B]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Generate Plan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {plan.map((dayPlan, dayIndex) => (
            <div key={dayPlan.day + dayIndex} className="space-y-2.5">
              <div className="flex justify-between items-end px-1">
                <h3 className="text-[18px] font-bold text-[#1A1A1A]">
                  {dayPlan.dateStr || dayPlan.day}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#8C857D] font-medium">
                    {dayPlan.meals.length} meal{dayPlan.meals.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        type: "day",
                        dayIndex,
                        title: dayPlan.dateStr || dayPlan.day,
                        subtitle: `This will remove all ${dayPlan.meals.length} meal${dayPlan.meals.length === 1 ? "" : "s"} planned for this day.`,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8C857D] hover:text-[#DC2626] hover:bg-[#FEF2F2] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Delete plan for this day"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete day</span>
                  </button>
                </div>
              </div>

              {/* Meal Cards */}
              <div className="bg-white border border-[#EBE3D5] rounded-[20px] divide-y divide-[#F3EFE7] shadow-xs overflow-hidden">
                {!dayPlan.meals || dayPlan.meals.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-[#FAF8F5]/60">
                    <p className="text-[13.5px] font-medium text-[#78716A]">No meals planned for this day yet.</p>
                    <button
                      type="button"
                      onClick={() => handleHealSingleDay(dayIndex)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF0ED] text-[#D1654B] text-xs font-bold rounded-full border border-[#F5C7BD] hover:bg-[#F5C7BD]/40 active:scale-98 transition-all cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Add meals for this day</span>
                    </button>
                  </div>
                ) : (
                  dayPlan.meals.map((meal) => {
                  const isSwapping = swappingKey === `${dayIndex}-${meal.slot}`;
                  return (
                    <div
                      key={meal.slot}
                      className="p-4 flex justify-between items-start min-h-[80px] gap-3"
                    >
                      <div className="flex-1 min-w-0 pr-1">
                        {/* Slot label & tags */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-bold text-[#D1654B] uppercase tracking-tight">
                            {SLOT_LABELS[meal.slot]}
                          </span>
                          {meal.isCustomEdited && (
                            <span className="inline-flex items-center gap-1 bg-[#FAF0ED] text-[#D1654B] border border-[#F5C7BD] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              <Sparkles className="w-2.5 h-2.5" />
                              Custom Pick
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 bg-[#F3EFE7] text-[#635E58] text-[10px] font-medium px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" />
                            {meal.cookTime}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-[#F3EFE7] text-[#635E58] text-[10px] font-medium px-2 py-0.5 rounded-full">
                            <Flame className="w-2.5 h-2.5 text-[#D1654B]" />
                            {getMealCalories(meal)}
                          </span>
                        </div>

                        {/* Dish name */}
                        <div className="text-[16px] font-semibold text-[#1A1A1A] leading-snug">
                          {isSwapping ? (
                            <span className="text-[#8C857D] animate-pulse">
                              Finding alternative...
                            </span>
                          ) : (
                            meal.dish
                          )}
                        </div>

                        {/* Why this recommendation - full complete sentence fitting within 2-3 lines */}
                        {meal.why && (
                          <p className="text-[12.5px] text-[#78716A] line-clamp-3 leading-relaxed mt-1 font-normal">
                            "{meal.why}"
                          </p>
                        )}

                        {/* Edit & View Recipe CTAs */}
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <button
                            id={`edit-meal-btn-${dayIndex}-${meal.slot}`}
                            type="button"
                            onClick={() =>
                              setEditingMeal({
                                dayIndex,
                                meal,
                                dayLabel: dayPlan.dateStr || dayPlan.day,
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#59534B] hover:text-[#D1654B] bg-[#F5F2EB] hover:bg-[#FAF0ED] px-2.5 py-1 rounded-full active:scale-95 transition-all cursor-pointer"
                            title="Change to a dish of your choice"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRecipeDish({
                                dish: meal.dish,
                                cookTime: meal.cookTime,
                                preloadedRecipe: meal.recipe,
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D1654B] hover:text-[#B84E36] bg-[#FAF0ED] hover:bg-[#F3EFE7] px-2.5 py-1 rounded-full active:scale-95 transition-all cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>View Recipe</span>
                          </button>
                        </div>
                      </div>

                      {/* Right action area: top right small delete icon + optional swap/refresh underneath */}
                      <div className="flex flex-col items-end justify-between shrink-0 self-stretch min-h-[72px]">
                        <button
                          id={`delete-meal-btn-${dayIndex}-${meal.slot}`}
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: "meal",
                              dayIndex,
                              slot: meal.slot,
                              title: meal.dish,
                              subtitle: `From ${dayPlan.dateStr || dayPlan.day} (${SLOT_LABELS[meal.slot]})`,
                            })
                          }
                          className="text-[#A8A196] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 p-1.5 rounded-full transition-colors cursor-pointer"
                          title={`Delete ${meal.dish}`}
                          aria-label={`Delete ${meal.dish}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Action buttons: Swap dish with another meal & Alternative dish (only when plan is unlocked) */}
                        {!isLocked && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              id={`swap-icon-btn-${dayIndex}-${meal.slot}`}
                              type="button"
                              onClick={() =>
                                setSwapSource({
                                  dayIndex,
                                  slot: meal.slot,
                                  meal,
                                  dayLabel: dayPlan.dateStr || dayPlan.day,
                                })
                              }
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDFBF7] hover:bg-[#F3EFE7] border border-[#EBE3D5] hover:border-[#D1654B]/40 text-[#635E58] hover:text-[#D1654B] active:scale-95 transition-all shadow-xs cursor-pointer"
                              title="Swap with another meal in your plan"
                              aria-label={`Swap ${meal.dish} with another meal`}
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>

                            <button
                              id={`swap-btn-${dayIndex}-${meal.slot}`}
                              type="button"
                              disabled={isSwapping}
                              onClick={() => handleSwap(dayIndex, meal.slot)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF0ED] hover:bg-[#D1654B] border border-[#D1654B]/30 text-[#D1654B] hover:text-white active:scale-95 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                              title="Suggest alternative dish"
                              aria-label={`Suggest alternative for ${meal.dish}`}
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${isSwapping ? "animate-spin" : ""}`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          ))}

          {/* Plan more days button */}
          <button
            id="plan-add-days-btn"
            type="button"
            disabled={addingDays}
            onClick={() => setIsPlanMoreModalOpen(true)}
            className="w-full py-4 rounded-[18px] border-2 border-dashed border-[#D1654B]/40 hover:border-[#D1654B] bg-[#FDFBF7] hover:bg-[#FAF0ED]/40 text-[#D1654B] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {addingDays ? "Planning extra days..." : "+ Plan more days"}
            </span>
          </button>

          {addingDays && <DayPlanSkeleton />}
        </div>
      )}

      {/* Bottom-anchored CTAs - only shown when plan has meals */}
      {plan.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto pt-6 pb-8 px-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent z-10 space-y-2">
          <button
            id="plan-lock-cta"
            type="button"
            onClick={onLockPlan}
            className="w-full h-[56px] bg-[#D1654B] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-[#D1654B]/25 active:scale-[0.98] transition-transform flex items-center justify-center cursor-pointer"
          >
            Lock this plan
          </button>

          <button
            id="plan-edit-pref-link"
            type="button"
            onClick={onEditPreferences}
            className="w-full text-[#8C857D] hover:text-[#1A1A1A] font-bold text-[14px] h-[48px] flex items-center justify-center cursor-pointer"
          >
            Edit preferences
          </button>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeDish && (
        <RecipeModal
          dish={recipeDish.dish}
          cookTime={recipeDish.cookTime}
          preloadedRecipe={recipeDish.preloadedRecipe}
          onClose={() => setRecipeDish(null)}
        />
      )}

      {/* Edit Dish Modal */}
      {editingMeal && (
        <EditDishModal
          dayName={editingMeal.dayLabel}
          meal={editingMeal.meal}
          prefs={preferences}
          onClose={() => setEditingMeal(null)}
          onSuccess={handleMealEdited}
        />
      )}

      {/* Swap Dish Modal */}
      <SwapDishModal
        isOpen={!!swapSource}
        source={swapSource}
        plan={plan}
        onSwap={handleExecuteSwap}
        onClose={() => setSwapSource(null)}
      />

      {/* Plan More Days Modal */}
      {isPlanMoreModalOpen && (
        <PlanMoreDaysModal
          currentPlanLength={plan.length}
          lastDate={(() => {
            const d = new Date();
            d.setDate(d.getDate() + plan.length - 1);
            return d;
          })()}
          preferences={preferences}
          onEditPreferences={onEditPreferences}
          onAddDays={handleAddExtraDays}
          onClose={() => setIsPlanMoreModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Pop-up Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl border border-[#EBE3D5] space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                {deleteTarget.type === "day"
                  ? `Delete ${deleteTarget.title}?`
                  : `Delete "${deleteTarget.title}"?`}
              </h3>
              {deleteTarget.subtitle && (
                <p className="text-[13px] text-[#8C857D] leading-relaxed">
                  {deleteTarget.subtitle}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-[14px] border border-[#EBE3D5] font-semibold text-xs text-[#635E58] hover:bg-[#F3EFE7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-[14px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
