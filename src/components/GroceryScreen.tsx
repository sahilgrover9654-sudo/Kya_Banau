import React from "react";
import { ChevronLeft, ShoppingBag, ArrowLeft } from "lucide-react";
import { DayPlan } from "../types";
import { GrocerySection } from "./GrocerySection";
import {
  getStoredGroceryArranged,
  setStoredGroceryArranged,
  getStoredCustomGroceries,
  setStoredCustomGroceries,
} from "../utils/storage";
import { generateGroceryListFromPlan } from "../utils/grocery";

interface GroceryScreenProps {
  plan: DayPlan[];
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export function GroceryScreen({ plan, onBack, onShowToast }: GroceryScreenProps) {
  const [arrangedMap, setArrangedMap] = React.useState<Record<string, boolean>>(() =>
    getStoredGroceryArranged()
  );
  const [customGroceries, setCustomGroceries] = React.useState<any[]>(() =>
    getStoredCustomGroceries()
  );

  const groceryItems = React.useMemo(() => {
    const fromPlan = generateGroceryListFromPlan(plan);
    const combined = [...fromPlan, ...customGroceries];
    return combined.map((item) => ({
      ...item,
      arranged: !!arrangedMap[item.id],
    }));
  }, [plan, customGroceries, arrangedMap]);

  const handleToggleArranged = (id: string) => {
    setArrangedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setStoredGroceryArranged(next);
      return next;
    });
  };

  const handleMarkAllArranged = (allArranged: boolean) => {
    const next: Record<string, boolean> = {};
    if (allArranged) {
      groceryItems.forEach((item) => {
        next[item.id] = true;
      });
      onShowToast("All grocery items marked as arranged! 🎉");
    } else {
      onShowToast("Grocery items checklist reset.");
    }
    setArrangedMap(next);
    setStoredGroceryArranged(next);
  };

  const handleAddCustomGrocery = (
    name: string,
    category: any,
    quantity?: string
  ) => {
    const newItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      category,
      quantity,
      usedIn: [],
      arranged: false,
      isCustom: true,
    };
    const updated = [newItem, ...customGroceries];
    setCustomGroceries(updated);
    setStoredCustomGroceries(updated);
  };

  const handleRemoveCustomGrocery = (id: string) => {
    const updated = customGroceries.filter((i) => i.id !== id);
    setCustomGroceries(updated);
    setStoredCustomGroceries(updated);
    onShowToast("Removed custom item.");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28 pt-4 px-4 sm:px-6 max-w-[540px] mx-auto animate-in fade-in duration-200">
      {/* Dedicated Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          id="grocery-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-[#1A1A1A] bg-white border border-[#EBE3D5] hover:bg-[#F3EFE7] active:scale-95 transition-all shadow-2xs"
          aria-label="Back to Plan"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>My Plan</span>
        </button>

        <span className="text-[12px] font-medium text-[#8C857D]">
          {groceryItems.length} item{groceryItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mb-5">
        <h1
          id="grocery-screen-title"
          className="text-[26px] font-serif font-bold text-[#1A1A1A] tracking-tight"
        >
          Grocery Checklist
        </h1>
        <p className="text-[13px] text-[#8C857D] mt-0.5">
          Everything you need for your planned meals. Tick off items as you stock up.
        </p>
      </div>

      {plan.length === 0 ? (
        <div className="bg-white border border-[#EBE3D5] rounded-[22px] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-[16px] font-bold text-[#1A1A1A]">No active meal plan</h3>
          <p className="text-[13px] text-[#8C857D] max-w-[280px] mx-auto">
            Plan your meals first to automatically generate your complete grocery checklist.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#D1654B] text-white text-[13px] font-bold rounded-xl active:scale-95 transition-transform"
          >
            <span>Go to My Plan</span>
          </button>
        </div>
      ) : (
        <GrocerySection
          plan={plan}
          items={groceryItems}
          onToggleArranged={handleToggleArranged}
          onMarkAllArranged={handleMarkAllArranged}
          onAddCustomItem={handleAddCustomGrocery}
          onRemoveCustomItem={handleRemoveCustomGrocery}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
