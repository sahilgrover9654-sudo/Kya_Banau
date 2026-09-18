import React, { useState, useEffect, useMemo } from "react";
import { DayPlan, MealSlot, Meal, UserPreferences, UserProfile } from "../types";
import {
  Clock,
  Flame,
  Check,
  RefreshCw,
  Calendar,
  Sparkles,
  BookOpen,
  Home,
  ChevronLeft,
  ShoppingBag,
  ArrowRight,
  Trash2,
  ArrowLeftRight,
  User,
  LogIn,
  Pencil,
  Lock,
  Unlock,
} from "lucide-react";
import { swapDishApi, generatePlanApi, CLIENT_FALLBACK_TEMPLATES } from "../utils/api";
import {
  addStoredSwappedDish,
  getStoredSwappedDishes,
} from "../utils/storage";
import {
  logEvent,
  classifyError,
  getSessionRegenerateCount,
  incrementSessionRegenerateCount,
} from "../utils/events";
import { RecipeModal } from "./RecipeModal";
import { PlanMoreDaysModal } from "./PlanMoreDaysModal";
import { SwapDishModal } from "./SwapDishModal";
import { EditDishModal } from "./EditDishModal";
import { generateGroceryListFromPlan } from "../utils/grocery";
import { formatDayWithDate } from "../utils/dates";
import { getMealCalories } from "../utils/nutrition";

interface MyPlanScreenProps {
  plan: DayPlan[];
  user: UserProfile | null;
  preferences: UserPreferences;
  dishesMade: string[];
  onUpdatePlan: (plan: DayPlan[]) => void;
  onPlanMoreDays: () => void;
  onShowToast: (msg: string) => void;
  onLogout: () => void;
  swapCount: number;
  onIncrementSwap: () => void;
  onGoHome?: () => void;
  onOpenGrocery?: () => void;
  onOpenProfile?: () => void;
  isLocked?: boolean;
  onToggleLock?: (locked?: boolean) => void;
  onEditPreferences?: () => void;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export function MyPlanScreen({
  plan,
  user,
  preferences,
  dishesMade,
  onUpdatePlan,
  onPlanMoreDays,
  onShowToast,
  onLogout,
  swapCount,
  onIncrementSwap,
  onGoHome,
  onOpenGrocery,
  onOpenProfile,
  isLocked = true,
  onToggleLock,
  onEditPreferences,
}: MyPlanScreenProps) {
  const [swappingKey, setSwappingKey] = useState<string | null>(null);
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
  const [isPlanMoreModalOpen, setIsPlanMoreModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "day" | "meal";
    dayIndex: number;
    slot?: MealSlot;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [swapSource, setSwapSource] = useState<{
    dayIndex: number;
    slot: MealSlot;
    meal: Meal;
    dayLabel: string;
  } | null>(null);

  // Auto-heal any empty days in plan
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

  // Generate grocery items from active plan
  const groceryItems = useMemo(() => {
    return generateGroceryListFromPlan(plan);
  }, [plan]);

  // Determine current day of week to highlight
  const todayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

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

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "day") {
      const nextPlan = plan.filter((_, idx) => idx !== deleteTarget.dayIndex);
      onUpdatePlan(nextPlan);
      onShowToast(`Deleted plan for ${deleteTarget.title} 🗑️`);
    } else if (deleteTarget.type === "meal" && deleteTarget.slot) {
      const nextPlan = [...plan];
      const targetDay = nextPlan[deleteTarget.dayIndex];
      if (!targetDay) {
        setDeleteTarget(null);
        return;
      }

      const remainingMeals = targetDay.meals.filter((m) => m.slot !== deleteTarget.slot);

      if (remainingMeals.length === 0) {
        // If that was the only meal in the day, remove the day from the plan
        nextPlan.splice(deleteTarget.dayIndex, 1);
        onShowToast(`Removed ${deleteTarget.title} and cleared day`);
      } else {
        nextPlan[deleteTarget.dayIndex] = {
          ...targetDay,
          meals: remainingMeals,
        };
        onShowToast(`Removed ${deleteTarget.title} 🗑️`);
      }
      onUpdatePlan(nextPlan);
    }

    setDeleteTarget(null);
  };

  const toggleMealCompleted = (dayIdx: number, slot: MealSlot) => {
    const next = [...plan];
    const meals = [...next[dayIdx].meals];
    const mIdx = meals.findIndex((m) => m.slot === slot);
    if (mIdx !== -1) {
      meals[mIdx] = {
        ...meals[mIdx],
        completed: !meals[mIdx].completed,
      };
      next[dayIdx] = { ...next[dayIdx], meals };
      onUpdatePlan(next);
      if (meals[mIdx].completed) {
        onShowToast(`Marked ${meals[mIdx].dish} as done! 👏`);
      }
    }
  };

  const handleSwap = async (dayIdx: number, slot: MealSlot) => {
    const day = plan[dayIdx];
    const currentMeal = day.meals.find((m) => m.slot === slot);
    if (!currentMeal) return;

    const swapKey = `${dayIdx}-${slot}`;
    setSwappingKey(swapKey);

    try {
      const allDishes = plan.flatMap((d) => d.meals.map((m) => m.dish));
      const previouslySwapped = getStoredSwappedDishes();
      const exclude = Array.from(new Set([...allDishes, ...previouslySwapped]));

      const newMeal = await swapDishApi(
        slot,
        currentMeal.dish,
        preferences,
        exclude,
        dishesMade
      );

      addStoredSwappedDish(newMeal.dish);
      onIncrementSwap();

      const nextPlan = [...plan];
      const updatedMeals = nextPlan[dayIdx].meals.map((m) =>
        m.slot === slot ? newMeal : m
      );
      nextPlan[dayIdx] = { ...nextPlan[dayIdx], meals: updatedMeals };
      onUpdatePlan(nextPlan);
      onShowToast(`Swapped for ${newMeal.dish}!`);
    } catch (err) {
      console.error(err);
      onShowToast("Could not swap dish right now. Please try again.");
    } finally {
      setSwappingKey(null);
    }
  };

  // Add extra days handler
  const handleAddExtraDays = async (numDays: number) => {
    const existingDishes = plan.flatMap((d) => d.meals.map((m) => m.dish));
    const startDayOffset = plan.length;
    const startTime = performance.now();
    const inputText = `${(preferences.cuisines || []).join(", ")} | ${preferences.dietary || ""} | ${preferences.cookingTime || ""}`.trim();
    const currentRegenCount = getSessionRegenerateCount();

    try {
      const newDays = await generatePlanApi(
        preferences,
        dishesMade,
        numDays,
        existingDishes,
        startDayOffset
      );

      const updatedPlan = [...plan, ...newDays];
      onUpdatePlan(updatedPlan);
      onShowToast(`Added ${numDays} extra day${numDays > 1 ? "s" : ""} to your plan! 🎉`);

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
      console.error("Add extra days error:", err);
      const latency = performance.now() - startTime;
      logEvent("weekly_plan_failed", {
        latency_ms: latency,
        plan_days: numDays,
        input_text: inputText,
        regenerate_count: currentRegenCount,
        error_type: classifyError(err),
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 pb-32">
      {/* Navigation bar with Home button */}
      <div className="flex items-center justify-between mb-4">
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-[#1A1A1A] hover:bg-[#F3EFE7] text-[13px] font-semibold shadow-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#D1654B]" />
            <span>Home</span>
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <button
              id="myplan-profile-btn"
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
              <span className="text-[13px] font-semibold text-[#1A1A1A] max-w-[110px] truncate">{user.name}</span>
            </button>
          ) : (
            <button
              id="myplan-signin-btn"
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
        </div>
      </div>

      {/* Header bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[#D1654B] font-bold text-[12px] uppercase tracking-wider block">
              Active Kitchen Plan
            </span>
            {isLocked && (
              <span
                id="myplan-locked-badge"
                className="inline-flex items-center gap-1 bg-[#FAF0ED] text-[#D1654B] border border-[#F5C7BD] text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            )}
          </div>
          {onToggleLock && (
            <button
              id="myplan-toggle-lock-btn"
              type="button"
              onClick={() => onToggleLock(!isLocked)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C857D] hover:text-[#D1654B] transition-colors cursor-pointer"
              title={isLocked ? "Unlock plan to enable alternate suggestions" : "Lock plan to finalize meals"}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </>
              )}
            </button>
          )}
        </div>
        <h2 id="myplan-header-title" className="text-[30px] font-serif font-bold text-[#1A1A1A] leading-tight">
          This Week's Plan
        </h2>
        <p className="text-[13px] text-[#8C857D] mt-1">
          Review meals, check required groceries, and tick items as you arrange them.
        </p>
      </div>

      {/* Top Quick Grocery Banner */}
      <div
        id="myplan-grocery-banner"
        onClick={onOpenGrocery}
        className="bg-[#FDFBF7] border border-[#EBE3D5] hover:border-[#D1654B]/40 rounded-[18px] p-3.5 mb-6 flex items-center justify-between gap-3 shadow-xs cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[13px] font-bold text-[#1A1A1A] block group-hover:text-[#D1654B] transition-colors">
              Grocery list for this plan
            </span>
            <span className="text-[11px] text-[#8C857D]">
              {groceryItems.length} required items
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenGrocery) onOpenGrocery();
          }}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-[#D1654B] shrink-0"
        >
          <span>View Checklist</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Day Cards with exact "Monday, 3rd Jul" format */}
      {plan.length === 0 ? (
        <div className="bg-white border border-[#EBE3D5] rounded-[24px] p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
              No meals currently planned
            </h3>
            <p className="text-[13px] text-[#8C857D] max-w-xs mx-auto">
              Your schedule is clear. Plan upcoming days or create a fresh customized weekly plan.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={() => setIsPlanMoreModalOpen(true)}
              className="px-5 py-2.5 bg-[#D1654B] text-white rounded-[14px] font-bold text-xs shadow-xs hover:bg-[#B84E36] transition-colors cursor-pointer"
            >
              + Plan Days
            </button>
            {onPlanMoreDays && (
              <button
                type="button"
                onClick={onPlanMoreDays}
                className="px-5 py-2.5 border border-[#EBE3D5] text-[#1A1A1A] rounded-[14px] font-bold text-xs hover:bg-[#F3EFE7] transition-colors cursor-pointer"
              >
                New Weekly Plan
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {plan.map((dayPlan, dayIdx) => {
            // Calculate date fallback if dateStr is not already set
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayIdx);
            const formattedDateString = dayPlan.dateStr || formatDayWithDate(targetDate);

            const isToday =
              dayPlan.isToday ||
              dayPlan.day.toLowerCase() === todayName.toLowerCase() ||
              (dayIdx === 0 && !plan.some((p) => p.day.toLowerCase() === todayName.toLowerCase()));

            return (
              <div key={dayPlan.day + dayIdx} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-1 mb-1.5 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-[17px] font-bold text-[#1A1A1A] tracking-tight whitespace-nowrap">
                      {formattedDateString}
                    </h3>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-[#D1654B] text-[#FFFFFF] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <span className="text-[11px] text-[#8C857D] font-medium flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{dayPlan.meals.length} {dayPlan.meals.length === 1 ? "meal" : "meals"}</span>
                    </span>
                    <span className="text-[#DED6C7]">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "day",
                          dayIndex: dayIdx,
                          title: formattedDateString,
                          subtitle: `This will remove all ${dayPlan.meals.length} meal${dayPlan.meals.length === 1 ? "" : "s"} planned for this day.`,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C857D] hover:text-[#DC2626] px-1.5 py-0.5 rounded-md hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer whitespace-nowrap"
                      title="Delete plan for this day"
                      aria-label={`Delete plan for ${formattedDateString}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete day</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`bg-white border rounded-[20px] divide-y divide-[#F3EFE7] shadow-xs transition-all overflow-hidden ${
                    isToday
                      ? "border-[#D1654B] ring-1 ring-[#D1654B]/25"
                      : "border-[#EBE3D5]"
                  }`}
                >
                  {!dayPlan.meals || dayPlan.meals.length === 0 ? (
                    <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-[#FAF8F5]/60">
                      <p className="text-[13.5px] font-medium text-[#78716A]">No meals planned for this day yet.</p>
                      <button
                        type="button"
                        onClick={() => handleHealSingleDay(dayIdx)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF0ED] text-[#D1654B] text-xs font-bold rounded-full border border-[#F5C7BD] hover:bg-[#F5C7BD]/40 active:scale-98 transition-all cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add meals for this day</span>
                      </button>
                    </div>
                  ) : (
                    dayPlan.meals.map((meal) => {
                    const isSwapping = swappingKey === `${dayIdx}-${meal.slot}`;
                    return (
                      <div
                        key={meal.slot}
                        className={`p-4 flex justify-between items-start min-h-[85px] gap-3 transition-colors ${
                          meal.completed ? "bg-[#FAF8F5]/60" : ""
                        }`}
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#F3EFE7] text-[#635E58] px-2 py-0.5 rounded-full">
                              <Flame className="w-2.5 h-2.5 text-[#D1654B]" />
                              {getMealCalories(meal)}
                            </span>
                            {meal.cookTime && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#8C857D]">
                                <Clock className="w-3 h-3" />
                                {meal.cookTime}
                              </span>
                            )}
                          </div>

                          {/* Dish name with completion style */}
                          <h4
                            className={`text-[15px] font-bold text-[#1A1A1A] leading-snug ${
                              meal.completed ? "line-through text-[#8C857D]" : ""
                            }`}
                          >
                            {meal.dish}
                          </h4>

                          {/* Why note - complete sentence fitting within 2-3 lines */}
                          {meal.why && (
                            <p className="text-[12.5px] text-[#78716A] line-clamp-3 leading-relaxed mt-1 font-normal">
                              {meal.why}
                            </p>
                          )}

                          {/* Action links */}
                          <div className="flex items-center gap-3.5 mt-2.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => toggleMealCompleted(dayIdx, meal.slot)}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                meal.completed
                                  ? "text-[#2B6A42]"
                                  : "text-[#8C857D] hover:text-[#1A1A1A]"
                              }`}
                            >
                              <Check className={`w-3.5 h-3.5 ${meal.completed ? "stroke-[3]" : ""}`} />
                              <span>{meal.completed ? "Cooked" : "Mark as cooked"}</span>
                            </button>

                            <button
                              id={`edit-meal-myplan-btn-${dayIdx}-${meal.slot}`}
                              type="button"
                              onClick={() =>
                                setEditingMeal({
                                  dayIndex: dayIdx,
                                  meal,
                                  dayLabel: formattedDateString,
                                })
                              }
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#59534B] hover:text-[#D1654B] hover:underline cursor-pointer whitespace-nowrap"
                              title="Change to your choice"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D1654B] hover:text-[#B84E36] hover:underline cursor-pointer whitespace-nowrap"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Recipe</span>
                            </button>
                          </div>
                        </div>

                        {/* Right action area: top right small delete icon + optional alternative suggestion */}
                        <div className="flex flex-col items-end justify-between shrink-0 self-stretch min-h-[72px]">
                          <button
                            id={`delete-meal-myplan-btn-${dayIdx}-${meal.slot}`}
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: "meal",
                                dayIndex: dayIdx,
                                slot: meal.slot,
                                title: meal.dish,
                                subtitle: `From ${formattedDateString} (${SLOT_LABELS[meal.slot]})`,
                              })
                            }
                            className="text-[#A8A196] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 p-1.5 rounded-full transition-colors cursor-pointer"
                            title={`Delete ${meal.dish}`}
                            aria-label={`Delete ${meal.dish}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Action: Alternative suggestion (only available when plan is unlocked) */}
                          {!isLocked && (
                            <div className="flex items-center shrink-0 mt-2">
                              <button
                                id={`myplan-suggest-alternate-${dayIdx}-${meal.slot}`}
                                type="button"
                                disabled={isSwapping}
                                onClick={() => handleSwap(dayIdx, meal.slot)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF0ED] hover:bg-[#D1654B] border border-[#D1654B]/30 text-[#D1654B] hover:text-white active:bg-[#F3EFE7] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Suggest alternative dish"
                                aria-label={`Suggest alternative dish for ${meal.dish}`}
                              >
                                <RefreshCw
                                  className={`w-4 h-4 ${isSwapping ? "animate-spin text-[#D1654B]" : ""}`}
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
            );
          })}

          {/* CTA: Plan more days - triggers PlanMoreDaysModal */}
          <button
            id="myplan-plan-more-cta"
            type="button"
            onClick={() => setIsPlanMoreModalOpen(true)}
            className="w-full py-4 rounded-[18px] border-2 border-dashed border-[#D1654B]/40 hover:border-[#D1654B] bg-[#FDFBF7] hover:bg-[#FAF0ED]/40 text-[#D1654B] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Plan more days</span>
          </button>
        </div>
      )}

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
          onEditPreferences={onEditPreferences || onPlanMoreDays}
          onAddDays={handleAddExtraDays}
          onClose={() => setIsPlanMoreModalOpen(false)}
        />
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

      {/* Delete Confirmation Modal */}
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

      {/* Swap Dish Modal */}
      <SwapDishModal
        isOpen={!!swapSource}
        source={swapSource}
        plan={plan}
        onSwap={handleExecuteSwap}
        onClose={() => setSwapSource(null)}
      />
    </div>
  );
}
