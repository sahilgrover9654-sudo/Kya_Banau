import { UserPreferences, DayPlan, UserProfile, RecipeDetails, UserPreferenceMemory } from "../types";

const STORAGE_KEYS = {
  PREFERENCES: "kb_preferences",
  CALIBRATION_DONE: "kb_calibration_done",
  CALIBRATED_DISHES: "kb_calibrated_dishes",
  CURRENT_PLAN: "kb_current_plan",
  SWAPPED_DISHES: "kb_swapped_dishes",
  CUSTOM_DISHES: "kb_custom_dishes",
  LOCKED_ITEMS: "kb_locked_items",
  USER_PREFERENCE_MEMORY: "kb_user_pref_memory",
  RECIPE_CACHE: "kb_recipe_cache",
  USER: "kb_user",
  IS_LOCKED: "kb_is_locked",
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  cuisines: ["North Indian"],
  dietary: "Veg",
  cookingTime: "15–30 mins",
  mealTypes: ["dinner"],
  calorieGoal: "Flexible",
  planDuration: "1 day",
  healthyOnly: false,
};

export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      cuisines: Array.isArray(parsed.cuisines) && parsed.cuisines.length > 0 ? parsed.cuisines : DEFAULT_PREFERENCES.cuisines,
      mealTypes: Array.isArray(parsed.mealTypes) && parsed.mealTypes.length > 0 ? parsed.mealTypes : DEFAULT_PREFERENCES.mealTypes,
      cookingTime: parsed.cookingTime || DEFAULT_PREFERENCES.cookingTime,
      calorieGoal: parsed.calorieGoal || DEFAULT_PREFERENCES.calorieGoal,
      planDuration: parsed.planDuration || DEFAULT_PREFERENCES.planDuration,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function setStoredPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getIsCalibrationDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.CALIBRATION_DONE) === "true";
  } catch {
    return false;
  }
}

export function setIsCalibrationDone(done: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALIBRATION_DONE, done ? "true" : "false");
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredCalibratedDishes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CALIBRATED_DISHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredCalibratedDishes(dishes: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALIBRATED_DISHES, JSON.stringify(dishes));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredPlan(): DayPlan[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    let repaired = false;
    const prefs = getStoredPreferences();
    const activeSlots = prefs.mealTypes && prefs.mealTypes.length > 0 ? prefs.mealTypes : ["dinner"];

    const defaultSlotMeals: Record<string, any> = {
      breakfast: {
        slot: "breakfast",
        dish: "Kanda Poha with Roasted Peanuts",
        cookTime: "15 min",
        tag: "~250 kcal",
        calories: "~250 kcal",
        why: "Light, fast, and comforting morning start.",
      },
      lunch: {
        slot: "lunch",
        dish: "Rajma Chawal with Kachumber",
        cookTime: "30 min",
        tag: "~460 kcal",
        calories: "~460 kcal",
        why: "Hearty, nourishing home classic that sustains you.",
      },
      snacks: {
        slot: "snacks",
        dish: "Roasted Makhana with Rock Salt",
        cookTime: "10 min",
        tag: "~150 kcal",
        calories: "~150 kcal",
        why: "Crunchy, clean evening tea-time snack.",
      },
      dinner: {
        slot: "dinner",
        dish: "Yellow Dal Tadka & Jeera Rice",
        cookTime: "25 min",
        tag: "~420 kcal",
        calories: "~420 kcal",
        why: "Comforting, warm, and gentle on digestion.",
      },
    };

    const healedPlan = parsed.map((d: any) => {
      if (Array.isArray(d.meals) && d.meals.length > 0) {
        return d;
      }
      repaired = true;
      const backfilledMeals = activeSlots.map((slot: string) => defaultSlotMeals[slot] || defaultSlotMeals.dinner);
      return {
        ...d,
        meals: backfilledMeals,
      };
    });

    if (repaired) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(healedPlan));
    }
    return healedPlan;
  } catch {
    return null;
  }
}

export function setStoredPlan(plan: DayPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredSwappedDishes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SWAPPED_DISHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStoredSwappedDish(dish: string): void {
  try {
    const current = getStoredSwappedDishes();
    if (!current.includes(dish)) {
      current.push(dish);
      localStorage.setItem(STORAGE_KEYS.SWAPPED_DISHES, JSON.stringify(current));
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredCustomDishes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_DISHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStoredCustomDish(dish: string): void {
  try {
    const current = getStoredCustomDishes();
    if (!current.includes(dish)) {
      current.push(dish);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DISHES, JSON.stringify(current));
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredLockedItems(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCKED_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredLockedItems(items: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCKED_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getUserPreferenceMemory(): UserPreferenceMemory {
  try {
    const onboarding = getStoredCalibratedDishes();
    const custom = getStoredCustomDishes();
    const swapped = getStoredSwappedDishes();
    const locked = getStoredLockedItems();

    return {
      onboarding_picks: onboarding,
      locked_items: locked,
      edited_dishes: custom,
      rejected_dishes: swapped,
    };
  } catch {
    return {
      onboarding_picks: [],
      locked_items: [],
      edited_dishes: [],
      rejected_dishes: [],
    };
  }
}

export function setUserPreferenceMemory(memory: Partial<UserPreferenceMemory>): void {
  try {
    if (memory.onboarding_picks) {
      setStoredCalibratedDishes(memory.onboarding_picks);
    }
    if (memory.edited_dishes) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DISHES, JSON.stringify(memory.edited_dishes));
    }
    if (memory.rejected_dishes) {
      localStorage.setItem(STORAGE_KEYS.SWAPPED_DISHES, JSON.stringify(memory.rejected_dishes));
    }
    if (memory.locked_items) {
      setStoredLockedItems(memory.locked_items);
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getCachedRecipe(dish: string): RecipeDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPE_CACHE);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const key = dish.trim().toLowerCase();
    return cache[key] || null;
  } catch {
    return null;
  }
}

export function setCachedRecipe(dish: string, recipe: RecipeDetails): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPE_CACHE);
    const cache = raw ? JSON.parse(raw) : {};
    const key = dish.trim().toLowerCase();
    cache[key] = recipe;
    localStorage.setItem(STORAGE_KEYS.RECIPE_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredIsLocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.IS_LOCKED) === "true";
  } catch {
    return false;
  }
}

export function setStoredIsLocked(locked: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, locked ? "true" : "false");
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredGroceryArranged(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("kb_grocery_arranged");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStoredGroceryArranged(arrangedMap: Record<string, boolean>): void {
  try {
    localStorage.setItem("kb_grocery_arranged", JSON.stringify(arrangedMap));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getStoredCustomGroceries(): any[] {
  try {
    const raw = localStorage.getItem("kb_custom_groceries");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredCustomGroceries(items: any[]): void {
  try {
    localStorage.setItem("kb_custom_groceries", JSON.stringify(items));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    localStorage.removeItem("kb_grocery_arranged");
    localStorage.removeItem("kb_custom_groceries");
    sessionStorage.removeItem("kb_grocery_arranged");
    sessionStorage.removeItem("kb_custom_groceries");
  } catch (e) {
    console.error("Storage clear error:", e);
  }
}
