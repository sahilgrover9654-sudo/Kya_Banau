import { DayPlan, GroceryItem, GroceryCategory } from "../types";

interface IngredientRule {
  name: string;
  category: GroceryCategory;
  quantity?: string;
  matchWords: string[];
}

const INGREDIENT_RULES: IngredientRule[] = [
  // Dairy & Protein
  { name: "Fresh Paneer", category: "Dairy & Protein", quantity: "200g - 250g", matchWords: ["paneer"] },
  { name: "Farm Eggs", category: "Dairy & Protein", quantity: "4 - 6 eggs", matchWords: ["egg", "omelette", "dim"] },
  { name: "Chicken (Curry cut)", category: "Dairy & Protein", quantity: "500g", matchWords: ["chicken", "kosha"] },
  { name: "Fresh Curd / Dahi", category: "Dairy & Protein", quantity: "400g tub", matchWords: ["curd", "dahi", "raita", "kadhi", "gatte", "dum aloo"] },
  { name: "Fresh Milk", category: "Dairy & Protein", quantity: "500ml", matchWords: ["chai", "tea"] },
  { name: "Butter / Ghee", category: "Dairy & Protein", quantity: "100g", matchWords: ["butter", "ghee", "paratha", "khichdi", "bhurji"] },
  { name: "Fish Fillets / Rohu", category: "Dairy & Protein", quantity: "400g", matchWords: ["fish", "maach"] },

  // Fresh Produce & Herbs
  { name: "Potatoes (Aloo)", category: "Produce & Veggies", quantity: "1 kg", matchWords: ["aloo", "potato", "dum aloo", "samosa", "posto"] },
  { name: "Onions", category: "Produce & Veggies", quantity: "1 kg", matchWords: ["onion", "poha", "bhurji", "curry", "tadka", "masala", "uttapam", "kanda", "chaat", "rajma"] },
  { name: "Tomatoes", category: "Produce & Veggies", quantity: "750g", matchWords: ["tomato", "tameta", "bhurji", "curry", "tadka", "masala", "rajma", "pappu", "rasam"] },
  { name: "Ginger & Garlic", category: "Produce & Veggies", quantity: "100g each", matchWords: ["ginger", "garlic", "chutney", "tadka", "curry", "rajma", "adrak", "chai"] },
  { name: "Green Chillies & Fresh Coriander", category: "Produce & Veggies", quantity: "1 bunch", matchWords: ["chilli", "coriander", "poha", "chilla", "paratha", "curry", "dal", "chutney"] },
  { name: "Fresh Fenugreek (Methi) Leaves", category: "Produce & Veggies", quantity: "1 fresh bunch", matchWords: ["methi", "thepla"] },
  { name: "Bharta Eggplant (Baingan)", category: "Produce & Veggies", quantity: "1 large (500g)", matchWords: ["baingan", "bharta", "chokha"] },
  { name: "Fresh Lemons / Limes", category: "Produce & Veggies", quantity: "3 - 4 pcs", matchWords: ["lemon", "lime", "poha", "salad", "chaat"] },
  { name: "Fresh Coconut / Grated Coconut", category: "Produce & Veggies", quantity: "1 fresh coconut", matchWords: ["coconut", "chutney", "kerala", "stew", "appam", "kadala"] },
  { name: "Curry Leaves (Kadi Patta)", category: "Produce & Veggies", quantity: "1 small bunch", matchWords: ["poha", "upma", "uttapam", "sambar", "rasam", "tadka", "south"] },
  { name: "Sprouted Moong / Sprouts", category: "Produce & Veggies", quantity: "200g", matchWords: ["sprout", "misal"] },
  { name: "Sweet Corn / Bhutta", category: "Produce & Veggies", quantity: "2 cobs / 1 pack", matchWords: ["corn"] },
  { name: "Okra (Bhindi)", category: "Produce & Veggies", quantity: "500g", matchWords: ["bhindi"] },
  { name: "Cauliflower (Gobi) & Peas", category: "Produce & Veggies", quantity: "1 head + 200g peas", matchWords: ["gobi", "matar"] },
  { name: "Stir-fry Veggies (Capsicum, Cabbage, Carrot)", category: "Produce & Veggies", quantity: "1 pack assorted", matchWords: ["hakka", "noodles", "momo", "stew"] },

  // Grains, Lentils & Flours
  { name: "Whole Green Moong / Split Moong Dal", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["moong", "pesarattu", "khichdi"] },
  { name: "Rajma (Red Kidney Beans)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["rajma"] },
  { name: "Toor Dal (Pigeon Peas)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["dal tadka", "sambar", "pappu", "varan"] },
  { name: "Black Chickpeas (Kala Chana)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["kadala", "chana"] },
  { name: "Thick Poha (Flattened Rice)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["poha"] },
  { name: "Sooji / Rava (Semolina)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["upma", "rava"] },
  { name: "Besan (Gram Flour)", category: "Grains, Lentils & Flours", quantity: "500g", matchWords: ["besan", "chilla", "dhokla", "gatte", "pithore"] },
  { name: "Whole Wheat Atta (Flour)", category: "Grains, Lentils & Flours", quantity: "1 kg", matchWords: ["roti", "phulka", "paratha", "thepla"] },
  { name: "Basmati Rice", category: "Grains, Lentils & Flours", quantity: "1 kg", matchWords: ["rice", "chawal", "bhaat", "jeera rice", "khichdi"] },
  { name: "Idli / Dosa Fermented Batter", category: "Grains, Lentils & Flours", quantity: "1 kg pack", matchWords: ["dosa", "idli", "uttapam", "paniyaram", "appe"] },
  { name: "Fresh Pav / Sandwich Bread", category: "Grains, Lentils & Flours", quantity: "1 packet", matchWords: ["pav", "toast", "bread"] },
  { name: "Sattu (Roasted Gram Flour)", category: "Grains, Lentils & Flours", quantity: "250g", matchWords: ["sattu"] },
  { name: "Roasted Makhana (Foxnuts)", category: "Grains, Lentils & Flours", quantity: "100g", matchWords: ["makhana"] },
  { name: "Hakka Noodles", category: "Grains, Lentils & Flours", quantity: "1 pack", matchWords: ["noodle", "hakka"] },

  // Spices & Pantry Staples
  { name: "Mustard Seeds (Rai) & Cumin (Jeera)", category: "Pantry & Spices", quantity: "Pantry staple", matchWords: ["poha", "upma", "dal", "tadka", "aloo", "sambar"] },
  { name: "Raw Peanuts (Singdana)", category: "Pantry & Spices", quantity: "100g", matchWords: ["peanut", "poha", "upma", "sabudana"] },
  { name: "Kasuri Methi (Dried Fenugreek)", category: "Pantry & Spices", quantity: "Pantry staple", matchWords: ["paneer", "bhurji", "butter masala", "chicken"] },
  { name: "Sambar Powder / Rasam Powder", category: "Pantry & Spices", quantity: "1 small pack", matchWords: ["sambar", "rasam"] },
  { name: "Idli Podi (Gunpowder)", category: "Pantry & Spices", quantity: "1 small pack", matchWords: ["podi", "uttapam"] },
  { name: "Sev / Farsan (Crunchy Topping)", category: "Pantry & Spices", quantity: "1 pack", matchWords: ["sev", "bhel", "tameta", "misal"] },
  { name: "Puffed Rice (Murmura)", category: "Pantry & Spices", quantity: "200g", matchWords: ["bhel", "murmura"] },
  { name: "Kashmiri Red Chilli & Turmeric", category: "Pantry & Spices", quantity: "Pantry staple", matchWords: ["dum aloo", "curry", "dal"] },
  { name: "Fennel Seeds (Saunf) & Dry Ginger (Sonth)", category: "Pantry & Spices", quantity: "Pantry staple", matchWords: ["dum aloo", "kashmiri"] },
  { name: "Mustard Oil / Refined Oil", category: "Pantry & Spices", quantity: "500ml", matchWords: ["fish", "shorshe", "baingan", "posto", "mustard"] },
  { name: "Poppy Seeds (Posto / Khus Khus)", category: "Pantry & Spices", quantity: "50g", matchWords: ["posto"] },
];

/**
 * Generate a comprehensive, deduplicated grocery list from the user's active meal plan.
 */
export function generateGroceryListFromPlan(
  plan: DayPlan[],
  storedArrangedMap: Record<string, boolean> = {},
  customItems: GroceryItem[] = []
): GroceryItem[] {
  const itemMap = new Map<string, GroceryItem>();

  plan.forEach((dayPlan) => {
    const dayLabel = dayPlan.dateStr || dayPlan.day;

    dayPlan.meals.forEach((meal) => {
      const dishLower = meal.dish.toLowerCase();
      const slotName = meal.slot.charAt(0).toUpperCase() + meal.slot.slice(1);
      const dayAndSlot = `${dayLabel} • ${slotName}`;

      INGREDIENT_RULES.forEach((rule) => {
        const matches = rule.matchWords.some((word) => dishLower.includes(word));
        if (matches) {
          const key = rule.name.toLowerCase();
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            const alreadyLogged = existing.usedIn.some((u) => u.dish === meal.dish && u.dayAndSlot === dayAndSlot);
            if (!alreadyLogged) {
              existing.usedIn.push({ dish: meal.dish, dayAndSlot });
            }
          } else {
            const id = `g-${key.replace(/[^a-z0-9]/g, "-")}`;
            itemMap.set(key, {
              id,
              name: rule.name,
              category: rule.category,
              quantity: rule.quantity,
              usedIn: [{ dish: meal.dish, dayAndSlot }],
              arranged: !!storedArrangedMap[id],
            });
          }
        }
      });
    });
  });

  // Convert map to array
  const autoItems = Array.from(itemMap.values());

  // Sort by category order
  const categoryOrder: Record<GroceryCategory, number> = {
    "Produce & Veggies": 1,
    "Dairy & Protein": 2,
    "Grains, Lentils & Flours": 3,
    "Pantry & Spices": 4,
    "Other": 5,
  };

  autoItems.sort((a, b) => {
    const catDiff = (categoryOrder[a.category] || 9) - (categoryOrder[b.category] || 9);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });

  // Append any custom items added by the user
  const sanitizedCustom = customItems.map((c) => ({
    ...c,
    arranged: storedArrangedMap[c.id] ?? c.arranged,
  }));

  return [...autoItems, ...sanitizedCustom];
}
