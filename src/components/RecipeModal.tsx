import React, { useState, useEffect } from "react";
import { RecipeDetails } from "../types";
import { fetchRecipeApi } from "../utils/api";
import {
  X,
  Clock,
  Users,
  ChefHat,
  Sparkles,
  Check,
  Flame,
  UtensilsCrossed,
  Lightbulb,
} from "lucide-react";

interface RecipeModalProps {
  dish: string | null;
  cookTime?: string;
  preloadedRecipe?: RecipeDetails | null;
  onClose: () => void;
}

export function RecipeModal({ dish, cookTime, preloadedRecipe, onClose }: RecipeModalProps) {
  const [loading, setLoading] = useState(!preloadedRecipe || preloadedRecipe.dish !== dish);
  const [recipe, setRecipe] = useState<RecipeDetails | null>(
    preloadedRecipe && preloadedRecipe.dish === dish ? preloadedRecipe : null
  );
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!dish) return;

    if (preloadedRecipe && preloadedRecipe.dish === dish) {
      setRecipe(preloadedRecipe);
      setLoading(false);
      setCheckedIngredients({});
      return;
    }

    let isMounted = true;
    setLoading(true);
    setCheckedIngredients({});

    fetchRecipeApi(dish, cookTime)
      .then((data) => {
        if (isMounted) {
          setRecipe(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Recipe fetch error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dish, cookTime, preloadedRecipe]);

  if (!dish) return null;

  const toggleCheck = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div
      id="recipe-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="recipe-modal-content"
        className="w-full max-w-[420px] max-h-[85vh] sm:max-h-[88vh] bg-[#FDFBF7] rounded-t-[28px] sm:rounded-[28px] border border-[#EBE3D5] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Sticky Header */}
        <div className="px-6 pt-5 pb-3 border-b border-[#F3EFE7] bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#D1654B] uppercase tracking-wider block">
                Quick Recipe
              </span>
              <h3 className="text-[16px] font-serif font-bold text-[#1A1A1A] truncate">
                {dish}
              </h3>
            </div>
          </div>
          <button
            id="recipe-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors shrink-0"
            aria-label="Close recipe"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center animate-bounce">
                  <UtensilsCrossed className="w-8 h-8" />
                </div>
                <Sparkles className="w-5 h-5 text-[#D1654B] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-[280px]">
                <h4 className="text-[17px] font-bold text-[#1A1A1A]">
                  Cooking up your recipe...
                </h4>
                <p className="text-[12px] text-[#8C857D] leading-relaxed">
                  Preparing easy weekday instructions and ingredient measurements for <span className="font-semibold text-[#1A1A1A]">{dish}</span>.
                </p>
              </div>
            </div>
          ) : recipe ? (
            <>
              {/* Meta Chips & Description */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFE7] text-[#635E58] text-[11px] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#D1654B]" />
                    <span>{recipe.cookTime || cookTime || "20 min"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFE7] text-[#635E58] text-[11px] font-semibold">
                    <Users className="w-3.5 h-3.5 text-[#D1654B]" />
                    <span>{recipe.servings || "1-2 servings"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0ED] text-[#D1654B] text-[11px] font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{recipe.difficulty || "Easy"}</span>
                  </span>
                </div>

                <p className="text-[13px] text-[#635E58] leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              {/* Ingredients section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Ingredients ({recipe.ingredients.length})
                  </h4>
                  <span className="text-[11px] text-[#8C857D]">
                    Tap to check off
                  </span>
                </div>

                <div className="bg-white border border-[#EBE3D5] rounded-[18px] divide-y divide-[#F3EFE7] shadow-xs overflow-hidden">
                  {recipe.ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCheck(idx)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#FDFBF7] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-[#2B6A42] border-[#2B6A42] text-white"
                                : "border-[#D1C9BE] bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span
                            className={`text-[13px] font-medium leading-tight ${
                              isChecked
                                ? "line-through text-[#8C857D]"
                                : "text-[#1A1A1A]"
                            }`}
                          >
                            {ing.item}
                          </span>
                        </div>
                        <span className="text-[12px] text-[#8C857D] font-medium shrink-0 pl-2">
                          {ing.quantity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Step-by-Step ({recipe.steps.length} steps)
                </h4>

                <div className="space-y-2.5">
                  {recipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#EBE3D5] rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FAF0ED] text-[#D1654B] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-[13px] text-[#1A1A1A] leading-relaxed flex-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chef Tip */}
              {recipe.chefTip && (
                <div className="p-3.5 rounded-[16px] bg-[#FFF8EE] border border-[#FDE3B8] flex items-start gap-2.5 text-left">
                  <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[#B45309] block mb-0.5">
                      Pro Home-Chef Tip
                    </span>
                    <p className="text-[#92400E] leading-relaxed">
                      {recipe.chefTip}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-[#8C857D]">
              Could not load recipe details. Please try again.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#F3EFE7] bg-[#FDFBF7] shrink-0">
          <button
            id="recipe-modal-done-btn"
            type="button"
            onClick={onClose}
            className="w-full h-[48px] bg-[#D1654B] hover:bg-[#B84E36] text-white rounded-[16px] font-bold text-[14px] shadow-sm active:scale-[0.99] transition-all flex items-center justify-center"
          >
            Done Cooking
          </button>
        </div>
      </div>
    </div>
  );
}
