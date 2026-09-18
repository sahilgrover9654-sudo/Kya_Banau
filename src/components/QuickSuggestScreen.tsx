import React, { useState } from "react";
import { QuickSuggestResult, UserPreferences } from "../types";
import { quickSuggestApi } from "../utils/api";
import { isNonFoodItem } from "../utils/ingredientValidator";
import { QuickSuggestSkeleton } from "./SkeletonLoader";
import { RecipeModal } from "./RecipeModal";
import { logEvent, classifyError } from "../utils/events";
import {
  Clock,
  X,
  Sparkles,
  RefreshCw,
  ChefHat,
  BookOpen,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";

interface QuickSuggestScreenProps {
  preferences: UserPreferences;
  onBack?: () => void;
}

const COMMON_SHORTCUTS = [
  "paneer",
  "eggs",
  "tomato",
  "onion",
  "potato",
  "curd",
  "chicken",
  "bread",
];

export function QuickSuggestScreen({
  preferences,
  onBack,
}: QuickSuggestScreenProps) {
  const [items, setItems] = useState<string[]>(["onion", "tomato"]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickSuggestResult | null>(null);
  const [recipeDish, setRecipeDish] = useState<{ dish: string; cookTime?: string } | null>(null);

  const addItem = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !items.includes(trimmed)) {
      setItems((prev) => [...prev, trimmed]);
      if (result?.status === "unclear") {
        setResult(null);
      }
    }
  };

  const removeItem = (item: string) => {
    setItems(items.filter((i) => i !== item));
    if (result?.status === "unclear") {
      setResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(inputValue);
      setInputValue("");
    }
  };

  const handleAddInput = () => {
    if (inputValue.trim()) {
      addItem(inputValue);
      setInputValue("");
    }
  };

  const handleSuggest = async (excludeDish = "") => {
    setLoading(true);
    const startTime = performance.now();
    const ingredientsInput = items.join(", ");

    try {
      const res = await quickSuggestApi(items, preferences, excludeDish);
      setResult(res);

      // Log an event only on success — after the model response has come back AND been successfully parsed AND rendered to the user.
      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        logEvent("quick_meal_generate", {
          latency_ms: latency,
          ingredients_input: ingredientsInput,
          suggestions_returned: res ? 1 : 0,
        });
      });
    } catch (err: any) {
      console.error(err);
      const latency = performance.now() - startTime;
      logEvent("quick_meal_failed", {
        latency_ms: latency,
        ingredients_input: ingredientsInput,
        suggestions_returned: 0,
        error_type: classifyError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28 pt-4 px-6">
      {/* Top Header: Back arrow only */}
      <div className="flex items-center mb-2">
        <button
          id="quick-suggest-back-btn"
          type="button"
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#F3EFE7] active:scale-95 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2]" />
        </button>
      </div>

      {/* Header */}
      <div className="mb-5">
        <h1 id="quick-suggest-title" className="text-[28px] font-serif font-bold text-[#1A1A1A] leading-tight">
          Quick Meal
        </h1>
        <p id="quick-suggest-subtext" className="text-[13px] text-[#8C857D] mt-1 leading-relaxed">
          Type what you have on hand — we'll assume basic oil, salt, and spices are in your kitchen.
        </p>
      </div>

      {/* Chip Input Area */}
      <div className="space-y-3 mb-6">
        <div className="bg-white border border-[#EBE3D5] rounded-[20px] p-4 shadow-xs focus-within:border-[#D1654B] transition-colors">
          {/* Active chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {items.map((item) => {
              const nonFood = isNonFoodItem(item);
              return (
                <span
                  key={item}
                  className={`inline-flex items-center gap-1.5 border text-xs font-semibold px-3 py-1 rounded-full capitalize transition-colors ${
                    nonFood
                      ? "bg-[#FAF0ED] border-[#F5C7BD] text-[#D1654B]"
                      : "bg-[#F3EFE7] border-[#EBE3D5] text-[#1A1A1A]"
                  }`}
                >
                  <span>{item}</span>
                  {nonFood && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#D1654B] text-white px-1.5 py-0.2 rounded-full">
                      Not food
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      nonFood ? "text-[#D1654B] hover:text-[#B54A32]" : "text-[#8C857D] hover:text-[#D1654B]"
                    }`}
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>

          {/* Text Input */}
          <div className="flex items-center gap-2">
            <input
              id="quick-suggest-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                items.length === 0 ? "Type an item (e.g. palak, capsicum)..." : "Add another item..."
              }
              className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#8C857D] focus:outline-none min-h-[40px] px-1"
            />
            {inputValue.trim() && (
              <button
                type="button"
                onClick={handleAddInput}
                className="px-3.5 py-1.5 bg-[#D1654B] text-white text-xs font-bold rounded-[10px]"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* 8 Common Shortcuts */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#8C857D] uppercase tracking-tight block">
            Common items
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SHORTCUTS.map((sc) => {
              const isAdded = items.includes(sc);
              return (
                <button
                  key={sc}
                  id={`shortcut-${sc}`}
                  type="button"
                  onClick={() => (isAdded ? removeItem(sc) : addItem(sc))}
                  className={`min-h-[42px] px-3.5 py-1.5 rounded-[12px] text-xs font-semibold capitalize transition-all ${
                    isAdded
                      ? "bg-[#2B6A42] text-[#FFFFFF] shadow-xs"
                      : "bg-white border border-[#EBE3D5] text-[#1A1A1A] active:bg-[#F3EFE7]"
                  }`}
                >
                  {isAdded ? `✓ ${sc}` : `+ ${sc}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggest a Dish CTA */}
      <div className="mb-6">
        <button
          id="quick-suggest-cta"
          type="button"
          disabled={loading || items.length === 0}
          onClick={() => handleSuggest()}
          className="w-full h-[56px] bg-[#D1654B] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-[#D1654B]/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ChefHat className="w-5 h-5" />
          <span>Suggest a dish</span>
        </button>
      </div>

      {/* Result presentation */}
      {loading ? (
        <QuickSuggestSkeleton />
      ) : result?.status === "unclear" ? (
        <div
          id="quick-suggest-unclear-card"
          className="bg-white border-2 border-[#D1654B]/30 rounded-[20px] p-6 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FAF0ED] border border-[#F5C7BD] flex items-center justify-center shrink-0 text-[#D1654B]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[17px] font-bold text-[#1A1A1A]">
                Please enter food ingredients
              </h3>
              <p className="text-[13px] text-[#635E58] leading-relaxed">
                {result.message}
              </p>
            </div>
          </div>

          {result.invalidItems && result.invalidItems.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                id="quick-suggest-remove-invalid-btn"
                type="button"
                onClick={() => {
                  setItems((prev) => prev.filter((it) => !result.invalidItems?.includes(it)));
                  setResult(null);
                }}
                className="px-3.5 py-2 bg-[#FAF0ED] hover:bg-[#D1654B] text-[#D1654B] hover:text-white rounded-[12px] text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove non-food item{result.invalidItems.length > 1 ? "s" : ""}</span>
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-[#F3EFE7] text-[12px] text-[#8C857D]">
            <span className="font-semibold text-[#1A1A1A]">Quick kitchen items to try:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["palak", "paneer", "dal", "potato", "onion", "tomato", "eggs"].map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => {
                    addItem(tip);
                    if (result.invalidItems) {
                      setItems((prev) => prev.filter((it) => !result.invalidItems?.includes(it)));
                    }
                    setResult(null);
                  }}
                  className="px-2.5 py-1 bg-[#F3EFE7] hover:bg-[#EBE3D5] text-[#1A1A1A] rounded-full text-xs font-medium transition-colors"
                >
                  + {tip}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : result?.status === "ok" && result.dish ? (
        <div
          id="quick-suggest-result-card"
          className="bg-white border border-[#EBE3D5] ring-1 ring-[#D1654B]/25 rounded-[20px] p-6 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#D1654B] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Right now, make this</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635E58] bg-[#F3EFE7] px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3 text-[#635E58]" />
              {result.cookTime}
            </span>
          </div>

          <h3 className="text-[24px] font-serif font-bold text-[#1A1A1A] leading-tight">
            {result.dish}
          </h3>

          <p className="text-[13px] text-[#1A1A1A] italic leading-relaxed bg-[#FDFBF7] p-3.5 rounded-[14px] border border-[#EBE3D5]">
            "{result.why}"
          </p>

          <div className="pt-2 border-t border-[#F3EFE7]">
            <span className="text-[11px] font-bold text-[#8C857D] block mb-2 uppercase tracking-tight">
              Key ingredients used:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.usesIngredients?.map((ing) => (
                <span
                  key={ing}
                  className="text-xs font-semibold bg-[#F3EFE7] text-[#1A1A1A] px-2.5 py-1 rounded-lg capitalize"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Actions: View Recipe & Suggest Another */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <button
              id="quick-suggest-view-recipe-btn"
              type="button"
              onClick={() => setRecipeDish({ dish: result.dish, cookTime: result.cookTime })}
              className="py-3 px-3 rounded-[16px] bg-[#FAF0ED] hover:bg-[#D1654B] text-[#D1654B] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs border border-[#D1654B]/30 active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>View Recipe</span>
            </button>
            <button
              id="quick-suggest-another-btn"
              type="button"
              onClick={() => handleSuggest(result.dish)}
              className="py-3 px-3 rounded-[16px] border-2 border-dashed border-[#EBE3D5] text-[#8C857D] hover:text-[#1A1A1A] font-bold text-xs flex items-center justify-center gap-1.5 active:bg-[#F3EFE7] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D1654B] shrink-0" />
              <span>Another idea</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Recipe Modal */}
      {recipeDish && (
        <RecipeModal
          dish={recipeDish.dish}
          cookTime={recipeDish.cookTime}
          onClose={() => setRecipeDish(null)}
        />
      )}
    </div>
  );
}
