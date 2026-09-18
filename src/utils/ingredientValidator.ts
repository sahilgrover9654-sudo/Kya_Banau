// Comprehensive ingredient and food validation for Quick Meal suggestions

export const KNOWN_NON_FOOD_TERMS = new Set([
  // Clothing & apparel
  "pajama", "pyjama", "pajamas", "pyjamas", "pant", "pants", "trouser", "trousers",
  "shirt", "tshirt", "t-shirt", "jeans", "shorts", "kurta", "kurti", "saree", "sari",
  "dupatta", "lungi", "dhoti", "suit", "blazer", "coat", "jacket", "sweater", "hoodie",
  "dress", "skirt", "top", "sock", "socks", "shoe", "shoes", "boot", "boots",
  "sneaker", "sneakers", "sandal", "sandals", "slipper", "slippers", "chappal", "chappals",
  "hat", "cap", "helmet", "scarf", "shawl", "glove", "gloves", "mitten", "mittens",
  "belt", "tie", "underwear", "bra", "vest", "towel", "cloth", "clothes", "clothing",
  "fabric", "blanket", "sheet", "bedsheet", "curtain",

  // Electronics, gadgets, technology
  "phone", "mobile", "smartphone", "iphone", "android", "laptop", "macbook", "computer",
  "pc", "monitor", "screen", "keyboard", "mouse", "charger", "cable", "wire", "cord",
  "plug", "battery", "powerbank", "tv", "television", "remote", "speaker", "headphone",
  "headphones", "earphone", "earphones", "airpod", "airpods", "earbuds", "tablet", "ipad",
  "watch", "smartwatch", "camera", "drone", "printer", "usb", "drive", "harddrive",

  // Household objects, furniture & fixtures
  "table", "chair", "desk", "sofa", "couch", "bed", "mattress", "pillow", "cushion",
  "door", "window", "wall", "floor", "ceiling", "roof", "fan", "cooler", "ac", "aircon",
  "light", "bulb", "tube", "tubelight", "lamp", "mirror", "clock", "calendar", "frame",
  "bucket", "mug", "mat", "carpet", "rug", "trash", "dustbin", "broom", "mop",

  // Toiletries & cleaning
  "soap", "shampoo", "conditioner", "detergent", "surf", "vim", "sanitizer", "toothpaste",
  "toothbrush", "comb", "brush", "perfume", "deodorant", "lotion", "cream", "cosmetic",
  "makeup", "lipstick",

  // Office, school & personal items
  "pen", "pencil", "paper", "notebook", "book", "eraser", "sharpener", "ruler", "scale",
  "bag", "backpack", "purse", "wallet", "money", "cash", "coin", "coins", "card",
  "creditcard", "debitcard", "key", "keys", "lock", "glasses", "spectacles", "sunglasses",
  "ring", "necklace", "bangle", "earring", "jewellery",

  // Vehicles, tools, hardware & raw materials
  "car", "bike", "bicycle", "motorcycle", "scooter", "truck", "bus", "train", "hammer",
  "nail", "screw", "screwdriver", "wrench", "pliers", "scissor", "scissors",
  "plastic", "glass", "wood", "metal", "iron", "steel", "aluminium", "copper", "gold",
  "silver", "cement", "brick", "stone", "rock", "sand", "mud", "dirt", "dust",
  "petrol", "diesel", "kerosene", "engine", "tire", "tyre",

  // Non-culinary animals / pests
  "dog", "cat", "puppy", "kitten", "pet", "snake", "lizard", "spider", "insect",
  "cockroach", "fly", "mosquito", "rat", "mouse",

  // Gibberish, prompts & placeholder words
  "asdf", "qwerty", "xyz", "abc", "test", "testing", "stuff", "thing", "things",
  "item", "items", "something", "nothing", "food", "ingredient", "ingredients",
  "recipe", "prompt", "system", "ignore", "hack", "hello", "hi", "bye",
]);

// Common everyday food words in English and Indian culinary terminology
export const COMMON_FOOD_KEYWORDS = new Set([
  // Allium, aromatics, roots & vegetables
  "onion", "pyaaz", "pyaj", "shallot", "spring onion", "scallion", "leek",
  "tomato", "tamatar", "cherry tomato",
  "potato", "aloo", "alu", "sweet potato", "shakarkand", "shakarkandi",
  "garlic", "lasun", "lahsun", "lehsan",
  "ginger", "adrak", "galangal",
  "chilli", "chillies", "chili", "chilis", "mirch", "mirchi", "green chilli", "red chilli",
  "capsicum", "bell pepper", "shimla mirch", "peppers",
  "spinach", "palak", "methi", "fenugreek", "saag", "sarson", "bathua", "kale",
  "coriander", "dhaniya", "cilantro", "mint", "pudina", "curry leaves", "kadi patta", "kasuri methi",
  "cauliflower", "gobi", "gobhi", "cabbage", "patta gobi", "band gobi", "broccoli",
  "carrot", "gajar", "radish", "mooli", "beetroot", "chukandar", "turnip", "shalgam",
  "peas", "matar", "green peas", "beans", "french beans", "cluster beans", "gawar",
  "bhindi", "okra", "ladyfinger", "ladies finger",
  "eggplant", "brinjal", "aubergine", "baingan",
  "bottle gourd", "lauki", "ghia", "doodhi", "bitter gourd", "karela",
  "ridge gourd", "turai", "tori", "sponge gourd", "snake gourd", "tinda",
  "pumpkin", "kaddu", "sitaphal", "ash gourd", "petha", "parwal", "kundru",
  "cucumber", "kheera", "kakdi", "raw mango", "kairi", "kachha aam",
  "mushroom", "mushrooms", "khumb", "corn", "sweet corn", "makka", "baby corn",
  "drumstick", "saijan", "moringa", "lotus stem", "kamal kakdi", "yam", "suran", "jimikand", "arbi", "colocasia",
  "zucchini", "avocado",

  // Lentils, pulses, beans & legumes
  "dal", "daal", "lentil", "lentils", "pulse", "pulses",
  "toor", "tur", "arhar", "moong", "mung", "green gram", "yellow moong",
  "chana", "chana dal", "chickpea", "chickpeas", "kabuli chana", "kala chana", "chole",
  "rajma", "kidney beans", "urad", "black gram", "masoor", "red lentil",
  "lobia", "black eyed peas", "sprouts", "sprouted moong", "soy", "soya", "soya chunks", "nutri",
  "besan", "gram flour", "sattu",

  // Grains, flours & bakery
  "atta", "wheat", "wheat flour", "whole wheat", "maida", "all purpose flour",
  "rice", "chawal", "basmati", "brown rice", "cooked rice", "steamed rice",
  "poha", "aval", "flattened rice", "murmura", "puffed rice",
  "suji", "sooji", "semolina", "rava", "daliya", "broken wheat",
  "oats", "rolled oats", "sabudana", "tapioca",
  "ragi", "nachni", "jowar", "sorghum", "bajra", "pearl millet", "millet",
  "bread", "white bread", "brown bread", "pav", "roti", "phulka", "chapati", "paratha", "puri", "poori",
  "pasta", "macaroni", "noodles", "vermicelli", "sevai", "seviyan",

  // Dairy & proteins
  "paneer", "cottage cheese", "cheese", "cheddar", "mozzarella",
  "butter", "makhan", "ghee", "clarified butter",
  "milk", "doodh", "curd", "dahi", "yogurt", "hung curd", "buttermilk", "chaas", "lassi",
  "cream", "malai", "fresh cream", "sour cream",
  "egg", "eggs", "ande", "egg white",
  "chicken", "chicken breast", "chicken thigh", "mutton", "lamb", "goat", "keema", "mince",
  "fish", "prawn", "prawns", "shrimp", "pomfret", "rohu", "salmon", "tofu",

  // Pantry, spices, seeds & nuts
  "oil", "cooking oil", "mustard oil", "sarson ka tel", "refined oil", "olive oil", "coconut oil", "sesame oil",
  "salt", "namak", "rock salt", "black salt", "kala namak",
  "sugar", "chini", "jaggery", "gur", "honey",
  "turmeric", "haldi", "cumin", "jeera", "mustard seeds", "rai", "sarson",
  "coriander powder", "dhaniya powder", "chilli powder", "red chilli powder", "lal mirch",
  "garam masala", "chaat masala", "amchur", "mango powder", "hing", "asafoetida",
  "ajwain", "carom seeds", "saunf", "fennel", "cinnamon", "dalchini",
  "clove", "cloves", "laung", "cardamom", "elaichi", "bay leaf", "tej patta",
  "black pepper", "kali mirch", "peppercorns", "tamarind", "imli", "lemon", "nimbu", "lime",
  "coconut", "nariyal", "desiccated coconut", "coconut milk",
  "peanut", "peanuts", "moongfali", "kaju", "cashew", "cashews", "badam", "almond", "almonds",
  "kishmish", "raisins", "walnut", "walnuts", "akhrot", "pistachio", "pista",
  "makhana", "fox nuts", "sesame", "til", "flaxseed", "chia seeds", "watermelon seeds", "magaz",

  // Fruits
  "apple", "seb", "banana", "kela", "mango", "aam", "orange", "santara",
  "papaya", "papita", "pomegranate", "anar", "grapes", "angoor",
  "watermelon", "tarbooz", "muskmelon", "kharbooza", "guava", "amrood", "pineapple", "ananas",
]);

/**
 * Normalizes an item string for checking
 */
export function normalizeItem(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Checks if a specific word or token represents an unambiguous non-food item
 */
export function isNonFoodItem(raw: string): boolean {
  const normalized = normalizeItem(raw);
  if (!normalized) return false;

  // Direct match
  if (KNOWN_NON_FOOD_TERMS.has(normalized)) {
    return true;
  }

  // Check singular/plural variants (e.g. pajamas -> pajama, shirts -> shirt)
  if (normalized.endsWith("s")) {
    const singular = normalized.slice(0, -1);
    if (KNOWN_NON_FOOD_TERMS.has(singular)) {
      return true;
    }
  }

  // Check multi-word phrase against non-food keywords
  const tokens = normalized.split(/[\s-]+/);
  for (const token of tokens) {
    if (token.length > 2 && KNOWN_NON_FOOD_TERMS.has(token)) {
      return true;
    }
    if (token.endsWith("s") && token.length > 3 && KNOWN_NON_FOOD_TERMS.has(token.slice(0, -1))) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if an item is a recognized food term or contains a known food keyword
 */
export function isRecognizedFood(raw: string): boolean {
  const normalized = normalizeItem(raw);
  if (!normalized) return false;

  if (COMMON_FOOD_KEYWORDS.has(normalized)) return true;

  // Check tokens
  const tokens = normalized.split(/[\s-]+/);
  for (const token of tokens) {
    if (COMMON_FOOD_KEYWORDS.has(token)) return true;
    if (token.endsWith("s") && COMMON_FOOD_KEYWORDS.has(token.slice(0, -1))) return true;
  }

  return false;
}

/**
 * Returns any non-food items found in the user's item list
 */
export function findNonFoodItems(items: string[]): string[] {
  const found: string[] = [];
  for (const item of items) {
    if (isNonFoodItem(item)) {
      found.push(item.trim());
    }
  }
  return found;
}

export interface ValidationResult {
  isValid: boolean;
  invalidItems: string[];
  message: string;
}

/**
 * Validates a list of kitchen ingredients provided by the user
 */
export function validateIngredientList(items: string[]): ValidationResult {
  const cleanItems = items.map((i) => i.trim()).filter(Boolean);

  if (cleanItems.length === 0) {
    return {
      isValid: false,
      invalidItems: [],
      message: "Please enter at least one food ingredient you have on hand.",
    };
  }

  const nonFood = findNonFoodItems(cleanItems);
  if (nonFood.length > 0) {
    const formatted = nonFood.map((n) => `"${n}"`).join(", ");
    return {
      isValid: false,
      invalidItems: nonFood,
      message: `Please remove non-food item${nonFood.length > 1 ? "s" : ""} (${formatted}) and enter edible kitchen ingredients.`,
    };
  }

  // Check if at least one item looks like food or isn't pure gibberish
  const hasFood = cleanItems.some((item) => isRecognizedFood(item));
  if (!hasFood && cleanItems.every((item) => item.length < 3 || /^[a-z]{1,2}$/i.test(item))) {
    return {
      isValid: false,
      invalidItems: cleanItems,
      message: "Please enter everyday cooking ingredients (e.g. vegetables, lentils, paneer, eggs, or spices).",
    };
  }

  return {
    isValid: true,
    invalidItems: [],
    message: "",
  };
}
