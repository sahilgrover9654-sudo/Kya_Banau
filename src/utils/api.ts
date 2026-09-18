import { DayPlan, QuickSuggestResult, UserPreferences, Meal, RecipeDetails, MealSlot, EditDishResult } from "../types";
import { formatDayWithDate } from "./dates";
import { setServerMeta } from "./events";
import { getStoredCustomDishes, getCachedRecipe, setCachedRecipe, getUserPreferenceMemory } from "./storage";
import { validateIngredientList, findNonFoodItems } from "./ingredientValidator";

export interface CalibrateResponse {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

export async function fetchCalibrateDishes(prefs: UserPreferences): Promise<CalibrateResponse> {
  try {
    const res = await fetch("/api/calibrate-dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuisines: prefs.cuisines,
        dietary: prefs.dietary,
      }),
    });
    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    if (
      data.breakfast?.length >= 5 &&
      data.lunch?.length >= 5 &&
      data.snacks?.length >= 5 &&
      data.dinner?.length >= 5
    ) {
      return data;
    }
  } catch (err) {
    console.warn("Using client-side fallback for taste calibration:", err);
  }

  // Fallback
  return {
    breakfast: [
      "Kanda Poha",
      "Besan Chilla with Mint Chutney",
      "Aloo Paratha with Curd",
      "Paneer Bhurji with Toast",
      "Methi Thepla with Pickle",
    ],
    lunch: [
      "Rajma Chawal with Kachumber",
      "Yellow Dal Tadka & Jeera Rice",
      "Bhindi Masala with Phulkas",
      "Chana Dal with Steamed Rice",
      "Sambar Rice with Potato Roast",
    ],
    snacks: [
      "Roasted Makhana with Rock Salt & Pepper",
      "Khamman Dhokla with Green Chutney",
      "Bhel Puri with Raw Mango",
      "Masala Corn Chaat",
      "Ginger Masala Chai with Marie Rusk",
    ],
    dinner: [
      "Aloo Methi with Phulkas",
      "Moong Dal Khichdi with Ghee & Pickle",
      "Baingan Bharta with Roti",
      "Paneer Butter Masala with Roti",
      "Matar Mushroom with Phulkas",
    ],
  };
}

export const CLIENT_FALLBACK_TEMPLATES: { breakfast: Meal; lunch: Meal; snacks: Meal; dinner: Meal }[] = [
  {
    breakfast: { slot: "breakfast", dish: "Pesarattu (Moong Dal Dosa) with Ginger Chutney", cookTime: "20 min", tag: "~230 kcal", calories: "~230 kcal", why: "Nutritious green gram crepe popular across Andhra." },
    lunch: { slot: "lunch", dish: "Kashmiri Dum Aloo with Steamed Rice", cookTime: "30 min", tag: "~460 kcal", calories: "~460 kcal", why: "Fennel and dry-ginger spiced baby potatoes." },
    snacks: { slot: "snacks", dish: "Khamman Dhokla with Mint Chutney", cookTime: "20 min", tag: "~180 kcal", calories: "~180 kcal", why: "Steamed, spongy, and low oil tea-time snack." },
    dinner: { slot: "dinner", dish: "Aloo Methi with Phulkas", cookTime: "25 min", tag: "~380 kcal", calories: "~380 kcal", why: "Earthy fenugreek and soft potatoes with hot rotis." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Onion Uttapam with Podi & Chutney", cookTime: "20 min", tag: "~270 kcal", calories: "~270 kcal", why: "Crisp edges, satisfying, and feels fresh." },
    lunch: { slot: "lunch", dish: "Rajma Chawal with Kachumber", cookTime: "35 min", tag: "~460 kcal", calories: "~460 kcal", why: "Comforting classic weekday lunch that fills you up." },
    snacks: { slot: "snacks", dish: "Roasted Makhana with Pepper", cookTime: "10 min", tag: "~150 kcal", calories: "~150 kcal", why: "Light crunchy snack with zero mess." },
    dinner: { slot: "dinner", dish: "Moong Dal Khichdi with Ghee & Pickle", cookTime: "20 min", tag: "~360 kcal", calories: "~360 kcal", why: "Restorative, gentle on the gut, and single-pot washup." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Paneer Bhurji with Butter Toast", cookTime: "15 min", tag: "~340 kcal", calories: "~340 kcal", why: "High protein, fast, and uses staples." },
    lunch: { slot: "lunch", dish: "Yellow Dal Tadka & Jeera Rice", cookTime: "25 min", tag: "~440 kcal", calories: "~440 kcal", why: "Gentle, quick, and different from yesterday's heavy food." },
    snacks: { slot: "snacks", dish: "Masala Corn Chaat with Lime", cookTime: "10 min", tag: "~160 kcal", calories: "~160 kcal", why: "Zesty sweet corn tossed in spices and herbs." },
    dinner: { slot: "dinner", dish: "Baingan Bharta with Roti", cookTime: "30 min", tag: "~380 kcal", calories: "~380 kcal", why: "Smoky roasted eggplant mash cooked with tomatoes." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Aloo Paratha with Curd", cookTime: "25 min", tag: "~370 kcal", calories: "~370 kcal", why: "Comforting weekend-feel fuel before long meetings." },
    lunch: { slot: "lunch", dish: "Sev Tameta Nu Shaak with Rotli", cookTime: "20 min", tag: "~390 kcal", calories: "~390 kcal", why: "Sweet, sour & spicy Gujarati tomato curry with crisp sev." },
    snacks: { slot: "snacks", dish: "Sprouted Moong Salad with Lime", cookTime: "10 min", tag: "~140 kcal", calories: "~140 kcal", why: "Nutritious raw crunch that sustains you until dinner." },
    dinner: { slot: "dinner", dish: "Paneer Butter Masala with Roti", cookTime: "25 min", tag: "~480 kcal", calories: "~480 kcal", why: "Creamy richness for a mid-week reward." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Kanda Poha with Roasted Peanuts", cookTime: "15 min", tag: "~250 kcal", calories: "~250 kcal", why: "Fast, light, and you said you make this often." },
    lunch: { slot: "lunch", dish: "Gatte ki Sabzi with Phulkas", cookTime: "30 min", tag: "~420 kcal", calories: "~420 kcal", why: "Spiced gram flour dumplings in aromatic curd gravy." },
    snacks: { slot: "snacks", dish: "Ginger Masala Chai with Marie Rusk", cookTime: "10 min", tag: "~120 kcal", calories: "~120 kcal", why: "Aromatic crushed adrak-elaichi tea for evening calm." },
    dinner: { slot: "dinner", dish: "Shev Bhaji with Hot Bhakri", cookTime: "20 min", tag: "~410 kcal", calories: "~410 kcal", why: "Spiced rassa soaked up with crisp fried sev." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Besan Chilla with Mint Chutney", cookTime: "20 min", tag: "~220 kcal", calories: "~220 kcal", why: "High protein start that takes just two pans." },
    lunch: { slot: "lunch", dish: "Kerala Kadala Curry with Steamed Rice", cookTime: "30 min", tag: "~440 kcal", calories: "~440 kcal", why: "Black chickpeas simmered in roasted coconut gravy." },
    snacks: { slot: "snacks", dish: "Bhel Puri with Raw Mango", cookTime: "15 min", tag: "~180 kcal", calories: "~180 kcal", why: "Refreshing street snack tossed in 10 mins." },
    dinner: { slot: "dinner", dish: "Alu Posto with Moong Dal & Roti", cookTime: "25 min", tag: "~400 kcal", calories: "~400 kcal", why: "Nutty poppy-seed potatoes with warm roti." },
  },
  {
    breakfast: { slot: "breakfast", dish: "Methi Thepla with Pickle", cookTime: "20 min", tag: "~280 kcal", calories: "~280 kcal", why: "Traditional Gujarati flatbread that stays soft all day." },
    lunch: { slot: "lunch", dish: "Sambar Rice with Potato Roast", cookTime: "30 min", tag: "~450 kcal", calories: "~450 kcal", why: "Tangy one-pot comfort with crunchy potatoes." },
    snacks: { slot: "snacks", dish: "Tawa Grilled Paneer Tikka Cubes", cookTime: "20 min", tag: "~220 kcal", calories: "~220 kcal", why: "Juicy marinated paneer browned on a hot tawa." },
    dinner: { slot: "dinner", dish: "Pithore ki Kadhi with Steamed Rice", cookTime: "25 min", tag: "~390 kcal", calories: "~390 kcal", why: "Silky besan diamonds simmered in sour curd gravy." },
  },
];

export async function generatePlanApi(
  prefs: UserPreferences,
  dishesMade: string[],
  numDays: number,
  excludeDishes: string[] = [],
  startDayOffset: number = 0,
  baseDate: Date = new Date()
): Promise<DayPlan[]> {
  const activeSlots: MealSlot[] =
    prefs.mealTypes && prefs.mealTypes.length > 0
      ? prefs.mealTypes
      : ["breakfast", "lunch", "dinner"];

  const attachDates = (rawDays: { day?: string; meals: Meal[] }[]): DayPlan[] => {
    return rawDays.map((d, i) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + startDayOffset + i);
      const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(targetDate);
      const dateStr = formatDayWithDate(targetDate);

      let dayMeals = Array.isArray(d.meals) && d.meals.length > 0 ? d.meals : [];
      if (dayMeals.length === 0) {
        const templateIndex = (startDayOffset + i) % CLIENT_FALLBACK_TEMPLATES.length;
        const template = CLIENT_FALLBACK_TEMPLATES[templateIndex];
        dayMeals = activeSlots.map((slot) => ({ ...template[slot] }));
      }

      return {
        ...d,
        day: dayName,
        dateStr,
        meals: dayMeals,
        isToday: startDayOffset === 0 && i === 0,
      };
    });
  };

  try {
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuisines: prefs.cuisines,
        dietary: prefs.dietary,
        cookingTime: prefs.cookingTime,
        mealTypes: prefs.mealTypes,
        calorieGoal: prefs.calorieGoal,
        planDuration: prefs.planDuration,
        healthyOnly: prefs.healthyOnly,
        dishesMade,
        numDays,
        startDayIndex: startDayOffset,
        excludeDishes,
        customDishes: getStoredCustomDishes(),
        user_preferences: getUserPreferenceMemory(),
      }),
    });
    if (!res.ok) throw new Error("Plan generation failed");
    const data = await res.json();
    if (data._meta) {
      setServerMeta(data._meta);
    }
    if (data.days && Array.isArray(data.days) && data.days.length > 0) {
      return attachDates(data.days);
    }
  } catch (err) {
    console.warn("Using client-side fallback for plan generation:", err);
  }

  // Robust client fallback
  const generated = Array.from({ length: numDays }, (_, i) => {
    const templateIndex = (startDayOffset + i) % CLIENT_FALLBACK_TEMPLATES.length;
    const template = CLIENT_FALLBACK_TEMPLATES[templateIndex];
    const meals = activeSlots.map((slot) => ({ ...template[slot] }));
    return {
      day: "",
      meals,
    };
  });

  return attachDates(generated);
}

export async function swapDishApi(
  slot: MealSlot,
  currentDish: string,
  prefs: UserPreferences,
  excludeDishes: string[],
  dishesMade: string[]
): Promise<Meal> {
  try {
    const res = await fetch("/api/swap-dish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot,
        currentDish,
        cuisines: prefs.cuisines,
        dietary: prefs.dietary,
        cookingTime: prefs.cookingTime,
        calorieGoal: prefs.calorieGoal,
        excludeDishes,
        dishesMade,
        customDishes: getStoredCustomDishes(),
        user_preferences: getUserPreferenceMemory(),
      }),
    });
    if (!res.ok) throw new Error("Swap failed");
    const data = await res.json();
    if (data.dish) {
      return {
        slot,
        dish: data.dish,
        cookTime: data.cookTime || "20 min",
        tag: data.tag || data.calories || "Quick",
        calories: data.calories || data.tag,
        why: data.why || "Fresh alternate that won't repeat previous meals.",
      };
    }
  } catch (err) {
    console.warn("Client fallback for swap:", err);
  }

  const fallbackList: Record<string, Meal[]> = {
    breakfast: [
      { slot: "breakfast", dish: "Upma with Coconut Chutney", cookTime: "15 min", tag: "Light", why: "Light and soothing with roasted semolina." },
      { slot: "breakfast", dish: "Methi Thepla with Pickle", cookTime: "20 min", tag: "Uses basics", why: "Rollable and easy with no extra dishes." },
      { slot: "breakfast", dish: "Onion Uttapam", cookTime: "20 min", tag: "Quick", why: "Crisp and golden on both sides." },
    ],
    lunch: [
      { slot: "lunch", dish: "Sambar Rice with Potato Roast", cookTime: "30 min", tag: "Uses basics", why: "Tangy tamarind broth with crunchy potatoes." },
      { slot: "lunch", dish: "Lemon Rice with Curd", cookTime: "20 min", tag: "Quick", why: "Bright, zesty, and zero fuss." },
      { slot: "lunch", dish: "Varan Bhaat with Ghee", cookTime: "20 min", tag: "Light", why: "Simple soothing comfort food." },
    ],
    snacks: [
      { slot: "snacks", dish: "Bhel Puri with Chutneys", cookTime: "15 min", tag: "Tangy", why: "Crisp puffed rice tossed with sev and chutney." },
      { slot: "snacks", dish: "Tawa Paneer Tikka Cubes", cookTime: "20 min", tag: "High-protein", why: "Juicy pan-seared paneer cubes with chaat masala." },
      { slot: "snacks", dish: "Ginger Chai with Rusk", cookTime: "10 min", tag: "Classic", why: "Warm spiced tea for an evening refresh." },
    ],
    dinner: [
      { slot: "dinner", dish: "Matar Mushroom with Phulkas", cookTime: "25 min", tag: "Light", why: "Lighter option that cooks in 25 minutes flat." },
      { slot: "dinner", dish: "Dosa with Tomato Chutney", cookTime: "15 min", tag: "Quick", why: "Fast fermented batter dinner." },
      { slot: "dinner", dish: "Egg Bhurji Pav", cookTime: "15 min", tag: "Quick", why: "Street-style spiced eggs with buttered pav." },
    ],
  };

  const pool = fallbackList[slot] || fallbackList.dinner;
  const pick = pool.find((p) => p.dish !== currentDish && !excludeDishes.includes(p.dish)) || pool[0];
  return { ...pick, slot };
}

export async function quickSuggestApi(
  ingredients: string[],
  prefs: UserPreferences,
  excludeDish: string = ""
): Promise<QuickSuggestResult> {
  // 1. Client-side deterministic validation
  const validation = validateIngredientList(ingredients);
  if (!validation.isValid) {
    return {
      status: "unclear",
      message: validation.message,
      invalidItems: validation.invalidItems,
      dish: "",
      cookTime: "",
      why: "",
      usesIngredients: [],
    };
  }

  try {
    const res = await fetch("/api/quick-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        cuisines: prefs.cuisines,
        dietary: prefs.dietary,
        excludeDish,
      }),
    });
    if (!res.ok) throw new Error("Quick suggest failed");
    const data = await res.json();
    if (data._meta) {
      setServerMeta(data._meta);
    }
    // Return unclear status directly to the caller!
    if (data.status === "unclear") {
      return {
        status: "unclear",
        message: data.message || "Please enter valid food ingredients you have on hand.",
        invalidItems: data.invalidItems,
        dish: "",
        cookTime: "",
        why: "",
        usesIngredients: [],
      };
    }
    if (data.status === "ok" && data.dish) {
      return data;
    }
  } catch (err) {
    console.warn("Client fallback for quick suggest:", err);
  }

  // Fallback based ONLY on genuine food items provided
  const nonFood = findNonFoodItems(ingredients);
  if (nonFood.length > 0) {
    return {
      status: "unclear",
      message: `Please remove non-food items (${nonFood.join(", ")}) and enter valid food ingredients.`,
      invalidItems: nonFood,
      dish: "",
      cookTime: "",
      why: "",
      usesIngredients: [],
    };
  }

  const lower = ingredients.map((i) => i.toLowerCase().trim());
  const has = (...keys: string[]) => lower.some((item) => keys.some((k) => item.includes(k)));

  if (has("paneer")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Paneer Bhurji with Paratha",
      cookTime: "15 min",
      why: "Fastest high-protein dinner using paneer, onion & tomatoes.",
      usesIngredients: ["paneer", ...lower.filter((i) => i.includes("onion") || i.includes("tomato"))],
    };
  }
  if (has("egg", "eggs")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Egg Bhurji with Toast",
      cookTime: "15 min",
      why: "Spiced scrambled eggs with onions and green chillies.",
      usesIngredients: ["eggs", ...lower.filter((i) => i.includes("onion") || i.includes("tomato"))],
    };
  }
  if (has("chicken")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Kadai Chicken with Warm Roti",
      cookTime: "30 min",
      why: "Wok-tossed chicken with chunky onions & tomatoes.",
      usesIngredients: ["chicken", ...lower.filter((i) => i.includes("onion") || i.includes("tomato"))],
    };
  }
  if (has("potato", "aloo")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Jeera Aloo with Phulkas",
      cookTime: "20 min",
      why: "Cumin-tempered golden potatoes that cook in a single pan.",
      usesIngredients: ["potato", ...lower.filter((i) => i.includes("tomato") || i.includes("onion"))],
    };
  }
  if (has("onion") && has("tomato")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Tamatar Pyaaz ki Sabzi with Phulkas",
      cookTime: "15 min",
      why: "Zesty, homestyle onion and tomato curry seasoned with mustard seeds.",
      usesIngredients: ["onion", "tomato"],
    };
  }
  if (has("tomato")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Tomato Chutney with Paratha",
      cookTime: "15 min",
      why: "Sweet, tangy tomato relish cooked down with cumin and chilli.",
      usesIngredients: ["tomato"],
    };
  }
  if (has("onion")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Kanda Masala Fry with Phulkas",
      cookTime: "12 min",
      why: "Caramelized onions tossed in turmeric, red chilli, and garam masala.",
      usesIngredients: ["onion"],
    };
  }
  if (has("curd", "dahi")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Dahi Tadka with Phulkas",
      cookTime: "10 min",
      why: "Tempered creamy spiced curd — ready in 10 minutes flat.",
      usesIngredients: ["curd"],
    };
  }
  if (has("dal", "lentil", "moong")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Dal Tadka with Steamed Rice",
      cookTime: "25 min",
      why: "Soothing golden lentils tempered with garlic and cumin ghee.",
      usesIngredients: ["dal"],
    };
  }
  if (has("bread")) {
    return {
      status: "ok",
      message: "Here is a quick dish you can cook right now.",
      dish: "Masala Bread Upma",
      cookTime: "15 min",
      why: "Toasted bread cubes tossed in a spiced onion-tomato tempering.",
      usesIngredients: ["bread"],
    };
  }

  const primary = lower[0] || "vegetables";
  return {
    status: "ok",
    message: "Here is a quick dish you can cook right now.",
    dish: `Homestyle Spiced ${primary.charAt(0).toUpperCase() + primary.slice(1)} with Phulkas`,
    cookTime: "20 min",
    why: `Simple, wholesome sauté using your ${ingredients.join(", ")} and pantry spices.`,
    usesIngredients: lower.slice(0, 3),
  };
}

export interface DetectIngredientsResult {
  isFood: boolean;
  items: string[];
  errorMessage?: string | null;
}

export async function detectIngredientsFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<DetectIngredientsResult> {
  const res = await fetch("/api/detect-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const data = await res.json().catch(() => ({
    isFood: false,
    items: [],
    errorMessage: "Could not communicate with the vision service.",
  }));

  return data;
}

export async function fetchRecipeApi(dish: string, cookTime: string = "20 min"): Promise<RecipeDetails> {
  const cached = getCachedRecipe(dish);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish, cookTime }),
    });

    if (res.ok) {
      const data = await res.json();
      setCachedRecipe(dish, data);
      return data;
    }
  } catch (e) {
    console.warn("fetchRecipeApi failed:", e);
  }

  // Safe client fallback
  const fallback: RecipeDetails = {
    dish,
    cookTime,
    servings: "1-2 servings",
    difficulty: "Easy",
    description: `A quick, wholesome homestyle preparation of ${dish} made with simple Indian kitchen staples.`,
    ingredients: [
      { item: "Key ingredient for " + dish, quantity: "1 standard portion" },
      { item: "Cooking Oil or Ghee", quantity: "1-2 tbsp" },
      { item: "Cumin seeds (Jeera)", quantity: "1 tsp" },
      { item: "Onion & Tomato", quantity: "1 each, chopped" },
      { item: "Turmeric, Red Chilli, Salt", quantity: "to taste" },
      { item: "Fresh Coriander", quantity: "for garnish" }
    ],
    steps: [
      "Prep your ingredients and keep spices measured beforehand.",
      "Heat oil or ghee in a pan and temper with cumin seeds until fragrant.",
      "Sauté onions and ginger-garlic until translucent and lightly golden.",
      "Add tomatoes and powdered spices; cook until soft and oil leaves the edges.",
      "Add main ingredients with a splash of water, cover, and simmer for 8-10 minutes. Garnish with fresh coriander."
    ],
    chefTip: "Covering the pan with a tight lid traps steam and cuts cooking time in half."
  };

  setCachedRecipe(dish, fallback);
  return fallback;
}

export async function editDishApi(
  inputText: string,
  slot: MealSlot,
  prefs: UserPreferences,
  currentDish: string
): Promise<EditDishResult> {
  try {
    const res = await fetch("/api/edit-dish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputText,
        slot,
        cuisines: prefs.cuisines,
        dietary: prefs.dietary,
        cookingTime: prefs.cookingTime,
        currentDish,
      }),
    });

    if (res.ok) {
      const data: EditDishResult = await res.json();
      if (data.valid && data.recipe && data.dish) {
        setCachedRecipe(data.dish, data.recipe);
      }
      return data;
    }
  } catch (err) {
    console.warn("editDishApi server error, running client evaluation:", err);
  }

  // Client-side fallback evaluation
  const trimmed = inputText.trim();
  if (trimmed.length < 2 || /^\d+$/.test(trimmed) || /^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return {
      valid: false,
      errorMessage: `I couldn't recognize "${trimmed}" as a food or meal dish. Please enter the name of a dish you'd like to cook (e.g., 'Matar Paneer', 'Rajma Chawal', or 'Vegetable Khichdi').`,
    };
  }

  const cleanTitle = trimmed
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const fallbackRecipe: RecipeDetails = {
    dish: cleanTitle,
    cookTime: "20 min",
    servings: "1-2 servings",
    difficulty: "Easy",
    description: `A fast, satisfying homestyle preparation of ${cleanTitle}.`,
    ingredients: [
      { item: `Key ingredients for ${cleanTitle}`, quantity: "1 standard portion" },
      { item: "Cooking Oil / Ghee", quantity: "1.5 tbsp" },
      { item: "Cumin Seeds (Jeera)", quantity: "1 tsp" },
      { item: "Onion & Tomato", quantity: "1 each, chopped" },
      { item: "Basic Spices (Haldi, Salt, Mirch)", quantity: "to taste" },
      { item: "Fresh Coriander", quantity: "for garnish" }
    ],
    steps: [
      "Measure and chop all required produce beforehand.",
      "Heat oil or ghee in a pan and crackle cumin seeds until aromatic.",
      "Sauté onions until translucent, then cook tomatoes and spices until soft.",
      "Add main ingredients, toss well, simmer covered on medium flame for 8-10 minutes.",
      "Garnish with fresh coriander and serve hot."
    ],
    chefTip: "Cover the pan during simmering to trap moisture and cut cooking time."
  };

  setCachedRecipe(cleanTitle, fallbackRecipe);

  return {
    valid: true,
    dish: cleanTitle,
    cookTime: "20 min",
    tag: "Custom pick",
    why: `Your custom pick: freshly prepared homestyle ${cleanTitle}.`,
    cuisine: "North Indian",
    recipe: fallbackRecipe,
  };
}
