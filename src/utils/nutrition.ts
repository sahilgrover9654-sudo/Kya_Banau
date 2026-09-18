import { Meal, MealSlot } from "../types";

/**
 * Curated calories per serving for common Indian homestyle dishes.
 * Reflects authentic home-cooked portions for 1 person on a weekday.
 */
const DISH_CALORIE_MAP: Record<string, number> = {
  // Breakfast items
  "kanda poha": 250,
  "poha": 250,
  "vegetable upma": 240,
  "upma with coconut chutney": 250,
  "upma": 240,
  "rava upma": 240,
  "idli sambar": 260,
  "idli with sambar": 260,
  "idli": 240,
  "plain dosa": 280,
  "masala dosa": 340,
  "onion uttapam": 270,
  "uttapam": 260,
  "pesarattu": 230,
  "besan chilla": 220,
  "moong dal chilla": 230,
  "methi thepla": 270,
  "thepla with pickle": 280,
  "thepla": 270,
  "aloo paratha": 360,
  "aloo paratha with curd": 370,
  "paneer paratha": 390,
  "gobi paratha": 330,
  "masala omelette with toast": 320,
  "masala omelette": 240,
  "boiled eggs with toast": 260,
  "egg bhurji with toast": 340,
  "egg bhurji with pav": 360,
  "egg bhurji": 260,
  "masala oats": 220,
  "bread upma": 250,
  "spiced bread upma": 250,

  // Lunch & Dinner Curries, Dals & Combos
  "chicken curry and steamed rice": 520,
  "chicken curry with steamed rice": 520,
  "home-style chicken curry with rice": 520,
  "chicken curry": 380,
  "kadai chicken with roti": 480,
  "kadai chicken": 360,
  "butter chicken with roti": 540,
  "tariwala egg curry with rice": 440,
  "tariwala egg curry with roti": 420,
  "egg curry": 340,
  "fish curry with steamed rice": 430,
  "dal tadka with steamed rice": 420,
  "dal tadka with phulkas": 380,
  "dal tadka with jeera rice": 440,
  "dal tadka": 220,
  "yellow dal tadka": 220,
  "rajma chawal": 460,
  "rajma chawal with kachumber": 460,
  "rajma curry with rice": 460,
  "chole rice": 480,
  "chole bhature": 580,
  "chole with kulche": 460,
  "dal makhani with roti": 490,
  "dal makhani with rice": 510,
  "moong dal khichdi with ghee": 360,
  "moong dal khichdi": 340,
  "khichdi with dahi": 350,
  "matar paneer with phulkas": 450,
  "matar paneer with jeera rice": 480,
  "matar paneer": 320,
  "palak paneer with phulkas": 420,
  "palak paneer with roti": 420,
  "palak paneer": 300,
  "paneer butter masala with roti": 520,
  "paneer butter masala": 380,
  "paneer bhurji with paratha": 440,
  "paneer bhurji with roti": 390,
  "paneer bhurji": 280,
  "kadai paneer with roti": 460,
  "aloo gobhi with phulkas": 340,
  "aloo gobi with phulkas": 340,
  "aloo methi with phulkas": 330,
  "aloo jeera with phulkas": 320,
  "jeera aloo with phulkas": 320,
  "bhindi masala with phulkas": 300,
  "bhindi do pyaza with roti": 310,
  "baingan bharta with roti": 320,
  "baingan bharta with phulkas": 320,
  "lauki sabzi with phulkas": 270,
  "tinda sabzi with phulkas": 260,
  "kashmiri dum aloo with steamed rice": 460,
  "sambar rice with potato roast": 420,
  "sambar rice": 360,
  "curd rice with tadka": 320,
  "curd rice": 300,
  "lemon rice with curd": 340,
  "lemon rice": 310,
  "varan bhaat with ghee": 350,
  "dahi tadka with phulkas": 320,
  "matar mushroom with phulkas": 340,
  "vegetable biryani": 480,
  "chicken biryani": 540,
  "egg biryani": 480,

  // Snacks
  "roasted makhana": 140,
  "roasted makhana with pepper": 140,
  "bhel puri with chutneys": 180,
  "bhel puri": 180,
  "khamman dhokla with mint chutney": 160,
  "khamman dhokla": 160,
  "dhokla": 160,
  "sprouted moong salad": 150,
  "ginger chai with rusk": 130,
  "masala chai with biscuits": 140,
  "tawa paneer tikka cubes": 240,
  "tawa paneer tikka": 240,
  "roasted chana": 150,
  "peanut chaat": 190,
  "corn chaat": 170,
  "samosa with chutney": 260,
  "vegetable pakora": 270,
};

/**
 * Estimates calories for an Indian meal dish name.
 * Uses exact lookup first, then keyword composition, then slot baseline.
 */
export function estimateDishCalories(dishName: string, slot?: MealSlot): string {
  if (!dishName) return "~350 kcal";

  const clean = dishName.toLowerCase().trim();

  // 1. Direct match
  if (DISH_CALORIE_MAP[clean]) {
    return `~${DISH_CALORIE_MAP[clean]} kcal`;
  }

  // 2. Partial key match
  for (const [key, cal] of Object.entries(DISH_CALORIE_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return `~${cal} kcal`;
    }
  }

  // 3. Keyword heuristic modeling
  let calories = 380;
  if (slot === "breakfast") calories = 290;
  else if (slot === "lunch") calories = 460;
  else if (slot === "snacks") calories = 180;
  else if (slot === "dinner") calories = 420;

  // Additions based on components
  if (clean.includes("chicken") || clean.includes("mutton") || clean.includes("meat")) {
    calories += 80;
  }
  if (clean.includes("paneer")) {
    calories += 60;
  }
  if (clean.includes("egg") || clean.includes("omelette") || clean.includes("bhurji")) {
    calories += 40;
  }
  if (clean.includes("rice") || clean.includes("chawal") || clean.includes("pulao") || clean.includes("biryani")) {
    calories += 40;
  }
  if (clean.includes("paratha") || clean.includes("poori") || clean.includes("puri") || clean.includes("bhature")) {
    calories += 60;
  }
  if (clean.includes("makhani") || clean.includes("butter") || clean.includes("ghee") || clean.includes("creamy")) {
    calories += 50;
  }
  if (clean.includes("salad") || clean.includes("soup") || clean.includes("makhana") || clean.includes("tea") || clean.includes("chai")) {
    calories = Math.min(calories, 180);
  }

  // Round to nearest 10 for clean display
  const rounded = Math.round(calories / 10) * 10;
  return `~${rounded} kcal`;
}

/**
 * Returns formatted calorie string for any meal card.
 * If meal.calories exists and is valid, returns it.
 * If meal.tag is formatted like "~350 kcal" or "350 kcal", returns it.
 * Otherwise computes realistic calories based on dish name and slot.
 */
export function getMealCalories(meal: {
  dish: string;
  slot?: MealSlot;
  calories?: string | number;
  tag?: string;
}): string {
  // If calories explicitly provided
  if (meal.calories) {
    const val = String(meal.calories).trim();
    if (val.includes("kcal")) return val.startsWith("~") ? val : `~${val}`;
    return `~${val} kcal`;
  }

  // If tag contains kcal
  if (meal.tag && meal.tag.toLowerCase().includes("kcal")) {
    const trimmed = meal.tag.trim();
    return trimmed.startsWith("~") ? trimmed : `~${trimmed}`;
  }

  // Otherwise calculate from dish name and slot
  return estimateDishCalories(meal.dish, meal.slot);
}
