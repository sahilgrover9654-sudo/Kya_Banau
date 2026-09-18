export type Cuisine =
  | "North Indian"
  | "South Indian"
  | "Maharashtrian"
  | "Gujarati"
  | "Bengali"
  | "Rajasthani"
  | "Punjabi"
  | "Kerala"
  | "Andhra / Telugu"
  | "Goan"
  | "Bihari / UP"
  | "Kashmiri"
  | "North Eastern"
  | "Chinese/Indo-Chinese"
  | "Continental";

export type DietaryPreference = "Veg" | "Non-veg" | "Both";

export type CookingTimePreference =
  | "Under 15 mins"
  | "15–30 mins"
  | "30–45 mins"
  | "Flexible";

export type PlanDuration = "1 day" | "3 days" | "1 week";

export type CalorieGoal =
  | "Flexible"
  | "~1,200 kcal"
  | "~1,500 kcal"
  | "~1,800 kcal"
  | "~2,200 kcal";

export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";

export interface UserPreferences {
  cuisines: Cuisine[];
  dietary: DietaryPreference;
  cookingTime?: CookingTimePreference;
  mealTypes?: MealSlot[];
  calorieGoal?: CalorieGoal;
  planDuration?: PlanDuration;
  healthyOnly?: boolean;
}

export interface UserPreferenceMemory {
  onboarding_picks: string[];
  locked_items: string[];
  edited_dishes: string[];
  rejected_dishes: string[];
}

export interface Meal {
  slot: MealSlot;
  dish: string;
  cookTime: string;
  tag: string;
  calories?: string | number;
  why: string;
  carryover_from?: string | null;
  completed?: boolean;
  recipe?: RecipeDetails;
  isCustomEdited?: boolean;
}

export interface EditDishResult {
  valid: boolean;
  errorMessage?: string | null;
  dish?: string;
  cookTime?: string;
  tag?: string;
  why?: string;
  cuisine?: string;
  recipe?: RecipeDetails;
  status?: "ok" | "unclear";
  message?: string;
}

export interface DayPlan {
  day: string;
  dateStr?: string;
  isToday?: boolean;
  meals: Meal[];
  assumption?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface QuickMealSuggestion {
  dish_name: string;
  ingredients_used: string[];
  missing_items: string[];
  steps: string[];
}

export interface QuickSuggestResult {
  status: "ok" | "unclear";
  message: string;
  invalidItems?: string[];
  dish: string;
  cookTime: string;
  why: string;
  usesIngredients: string[];
  missingItems?: string[];
  steps?: string[];
  suggestions?: QuickMealSuggestion[];
}

export interface RecipeIngredient {
  item: string;
  quantity: string;
}

export interface RecipeDetails {
  dish: string;
  cookTime: string;
  servings: string;
  difficulty: "Easy" | "Moderate";
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  chefTip?: string;
}

export type GroceryCategory =
  | "Produce & Veggies"
  | "Dairy & Protein"
  | "Grains, Lentils & Flours"
  | "Pantry & Spices"
  | "Other";

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity?: string;
  usedIn: { dish: string; dayAndSlot: string }[];
  arranged: boolean;
  isCustom?: boolean;
}

export type Screen =
  | "home"
  | "preferences"
  | "calibrate"
  | "plan"
  | "my_plan"
  | "grocery"
  | "quick_suggest";
