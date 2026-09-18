import React, { useState, useEffect, useRef } from "react";
import { Meal, UserPreferences } from "../types";
import { editDishApi } from "../utils/api";
import { addStoredCustomDish } from "../utils/storage";
import {
  X,
  Sparkles,
  AlertCircle,
  Pencil,
  Loader2,
  ChefHat,
  ArrowRight,
  Utensils
} from "lucide-react";

interface EditDishModalProps {
  dayName: string;
  meal: Meal;
  prefs: UserPreferences;
  onClose: () => void;
  onSuccess: (updatedMeal: Meal) => void;
}

const SLOT_SUGGESTIONS: Record<string, string[]> = {
  breakfast: [
    "Kanda Poha",
    "Aloo Paratha with Curd",
    "Besan Chilla",
    "Paneer Bhurji with Toast",
    "Methi Thepla with Pickle",
    "Idli with Sambar & Chutney",
  ],
  lunch: [
    "Rajma Chawal with Kachumber",
    "Yellow Dal Tadka & Jeera Rice",
    "Bhindi Masala with Phulkas",
    "Kadhi Pakora with Steamed Rice",
    "Chole Bhature",
    "Sambar Rice with Potato Roast",
  ],
  snacks: [
    "Khamman Dhokla with Green Chutney",
    "Masala Corn Chaat",
    "Roasted Makhana with Pepper",
    "Sprouted Moong Salad",
    "Bhel Puri with Raw Mango",
    "Tawa Paneer Tikka Cubes",
  ],
  dinner: [
    "Matar Paneer with Jeera Rice",
    "Moong Dal Khichdi with Ghee",
    "Aloo Methi with Phulkas",
    "Baingan Bharta with Roti",
    "Paneer Butter Masala",
    "Palak Paneer with Roti",
  ],
};

export function EditDishModal({
  dayName,
  meal,
  prefs,
  onClose,
  onSuccess,
}: EditDishModalProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const slotSuggestions = SLOT_SUGGESTIONS[meal.slot] || SLOT_SUGGESTIONS.dinner;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) {
      setErrorMessage("Please enter a dish name you would like to cook.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await editDishApi(query, meal.slot, prefs, meal.dish);

      if (!res.valid) {
        setErrorMessage(
          res.errorMessage ||
            `I didn't recognize "${query}" as an edible dish. Please enter a valid meal (e.g., 'Matar Paneer', 'Rajma Chawal', or 'Vegetable Khichdi') and try again.`
        );
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Valid response with generated dish & recipe
      const updatedMeal: Meal = {
        ...meal,
        dish: res.dish || query,
        cookTime: res.cookTime || meal.cookTime || "20 min",
        tag: res.tag || "Custom pick",
        why: res.why || `Your custom choice: freshly prepared homestyle ${res.dish || query}.`,
        recipe: res.recipe,
        isCustomEdited: true,
      };

      // Retain AI understanding for future context
      addStoredCustomDish(updatedMeal.dish);

      onSuccess(updatedMeal);
      onClose();
    } catch (err) {
      console.error("Edit dish error:", err);
      setErrorMessage(
        "Something went wrong while validating your dish. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  const handlePickSuggestion = (dishName: string) => {
    setInputText(dishName);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  return (
    <div
      id="edit-dish-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        id="edit-dish-modal-container"
        className="w-full max-w-[440px] bg-[#FDFBF7] rounded-t-[28px] sm:rounded-[28px] border border-[#EBE3D5] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F3EFE7] bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#D1654B] uppercase tracking-wider">
                  {dayName} • {meal.slot}
                </span>
              </div>
              <h3 className="text-[17px] font-serif font-bold text-[#1A1A1A] leading-tight">
                Change to your choice
              </h3>
            </div>
          </div>
          <button
            id="edit-dish-modal-close-btn"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors shrink-0 disabled:opacity-40"
            aria-label="Close edit dish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Currently Planned Banner */}
          <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#EBE5D8] flex items-start gap-3 text-xs text-[#59534B]">
            <Utensils className="w-4 h-4 text-[#8C857D] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[#8C857D] block text-[11px]">Currently planned:</span>
              <span className="font-semibold text-[#1A1A1A] truncate block text-[13px]">
                {meal.dish}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="custom-dish-input"
                className="block text-xs font-semibold text-[#403B35] mb-2"
              >
                What would you like to make instead?
              </label>
              <div className="relative">
                <input
                  id="custom-dish-input"
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={loading}
                  placeholder="e.g. Palak Paneer, Rajma Chawal, Moong Dal..."
                  className="w-full px-4 py-3 text-[14px] bg-white border border-[#DDD5C7] rounded-xl text-[#1A1A1A] placeholder-[#A8A196] focus:outline-hidden focus:border-[#D1654B] focus:ring-2 focus:ring-[#D1654B]/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                />
                {inputText && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("");
                      setErrorMessage(null);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A196] hover:text-[#59534B] p-1"
                    aria-label="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Error Message (Prompt to Re-input Clearly) */}
            {errorMessage && (
              <div
                id="edit-dish-error-banner"
                className="p-3.5 rounded-xl bg-[#FFF4E5] border border-[#F5C78E] flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="text-xs text-[#92400E] leading-relaxed">
                  <span className="font-semibold block mb-0.5">Could not recognize dish:</span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            <div>
              <span className="text-[11px] font-medium text-[#8C857D] block mb-2">
                Popular homestyle {meal.slot} ideas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {slotSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePickSuggestion(suggestion)}
                    className="text-[12px] px-2.5 py-1 rounded-full bg-white border border-[#E5DFD3] text-[#59534B] hover:border-[#D1654B] hover:text-[#D1654B] hover:bg-[#FAF0ED] active:scale-95 transition-all text-left truncate max-w-full disabled:opacity-50"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Notice */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C857D] pt-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D1654B] shrink-0" />
              <span>AI will craft a step-by-step recipe & remember your taste for future plans.</span>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                id="edit-dish-cancel-btn"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 text-xs font-semibold text-[#59534B] bg-[#F5F2EB] hover:bg-[#EBE5D8] rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="edit-dish-submit-btn"
                disabled={loading || !inputText.trim()}
                className="flex-2 py-3 px-4 text-xs font-semibold text-white bg-[#D1654B] hover:bg-[#B8533A] rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing recipe & updating...</span>
                  </>
                ) : (
                  <>
                    <span>Update Dish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
