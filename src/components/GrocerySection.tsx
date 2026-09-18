import React, { useState, useMemo } from "react";
import { DayPlan, GroceryItem, GroceryCategory } from "../types";
import {
  Check,
  Plus,
  Trash2,
  Share2,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
} from "lucide-react";

interface GrocerySectionProps {
  plan: DayPlan[];
  items: GroceryItem[];
  onToggleArranged: (id: string) => void;
  onMarkAllArranged: (arranged: boolean) => void;
  onAddCustomItem: (name: string, category: GroceryCategory, quantity?: string) => void;
  onRemoveCustomItem: (id: string) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_COLORS: Record<GroceryCategory, { bg: string; text: string; border: string }> = {
  "Produce & Veggies": { bg: "bg-[#EAF3EB]", text: "text-[#246337]", border: "border-[#C7E3CA]" },
  "Dairy & Protein": { bg: "bg-[#FDF1EB]", text: "text-[#B84E36]", border: "border-[#F6D5C7]" },
  "Grains, Lentils & Flours": { bg: "bg-[#FBF6EA]", text: "text-[#85631E]", border: "border-[#EDE2BE]" },
  "Pantry & Spices": { bg: "bg-[#F3EFE7]", text: "text-[#5C5549]", border: "border-[#DDD5C5]" },
  "Other": { bg: "bg-[#F5F5F5]", text: "text-[#666666]", border: "border-[#E0E0E0]" },
};

export function GrocerySection({
  plan,
  items,
  onToggleArranged,
  onMarkAllArranged,
  onAddCustomItem,
  onRemoveCustomItem,
  onShowToast,
}: GrocerySectionProps) {
  const [groupMode, setGroupMode] = useState<"category" | "day">("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<GroceryCategory>("Produce & Veggies");
  const [newItemQty, setNewItemQty] = useState("");
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  // Calculate stats
  const totalCount = items.length;
  const arrangedCount = items.filter((i) => i.arranged).length;
  const progressPercent = totalCount > 0 ? Math.round((arrangedCount / totalCount) * 100) : 0;

  // Filtered items (search only)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDish = item.usedIn.some((u) => u.dish.toLowerCase().includes(q));
        if (!matchesName && !matchesDish) return false;
      }
      return true;
    });
  }, [items, searchQuery]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const map = new Map<GroceryCategory, GroceryItem[]>();
    const categories: GroceryCategory[] = [
      "Produce & Veggies",
      "Dairy & Protein",
      "Grains, Lentils & Flours",
      "Pantry & Spices",
      "Other",
    ];

    categories.forEach((cat) => {
      const inCat = filteredItems.filter((i) => i.category === cat);
      if (inCat.length > 0) {
        map.set(cat, inCat);
      }
    });

    return map;
  }, [filteredItems]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();

    plan.forEach((dayPlan) => {
      const dayLabel = dayPlan.dateStr || dayPlan.day;
      const dayItems = filteredItems.filter((i) =>
        i.usedIn.some((u) => u.dayAndSlot.includes(dayLabel))
      );
      if (dayItems.length > 0) {
        map.set(dayLabel, dayItems);
      }
    });

    // Custom items or unassigned
    const customOrUnassigned = filteredItems.filter(
      (i) => i.isCustom || i.usedIn.length === 0
    );
    if (customOrUnassigned.length > 0) {
      map.set("General & Extra Staples", customOrUnassigned);
    }

    return map;
  }, [plan, filteredItems]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddCustomItem(newItemName.trim(), newItemCategory, newItemQty.trim() || undefined);
    setNewItemName("");
    setNewItemQty("");
    setIsAddingOpen(false);
    onShowToast(`Added "${newItemName}" to grocery list!`);
  };

  const handleCopyList = () => {
    if (items.length === 0) return;

    let text = `🛒 Kya Banau Grocery List (${arrangedCount}/${totalCount} arranged)\n\n`;

    const pending = items.filter((i) => !i.arranged);
    const arranged = items.filter((i) => i.arranged);

    if (pending.length > 0) {
      text += `[TO ARRANGE / BUY]:\n`;
      pending.forEach((i) => {
        text += `• [ ] ${i.name} ${i.quantity ? `(${i.quantity})` : ""}\n`;
      });
      text += `\n`;
    }

    if (arranged.length > 0) {
      text += `[ALREADY ARRANGED]:\n`;
      arranged.forEach((i) => {
        text += `• [✓] ${i.name}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    onShowToast("Grocery checklist copied to clipboard! 📋");
  };

  return (
    <div className="space-y-5">
      {/* Progress & Quick Summary Card */}
      <div className="bg-white border border-[#EBE3D5] rounded-[22px] p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#1A1A1A] leading-tight">
                  Kitchen Supplies & Pantry
                </h3>
                <p className="text-[12px] text-[#8C857D]">
                  {arrangedCount === totalCount && totalCount > 0
                    ? "All ingredients arranged for your planned meals!"
                    : `${arrangedCount} of ${totalCount} items arranged`}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[20px] font-bold text-[#1A1A1A]">
              {arrangedCount}
              <span className="text-[14px] text-[#8C857D] font-medium">/{totalCount}</span>
            </span>
            <span className="block text-[10px] uppercase font-bold text-[#D1654B]">
              {progressPercent}% Ready
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F3EFE7] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100 ? "bg-[#2B6A42]" : "bg-[#D1654B]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F3EFE7] text-[12px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] hover:bg-[#F3EFE7] text-[#1A1A1A] font-semibold border border-[#EBE3D5] transition-colors active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D1654B]" />
              <span>Copy List</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingOpen(!isAddingOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF0ED] hover:bg-[#F6D5C7] text-[#D1654B] font-semibold border border-[#F6D5C7] transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {arrangedCount < totalCount ? (
              <button
                type="button"
                onClick={() => onMarkAllArranged(true)}
                className="text-[11px] font-semibold text-[#2B6A42] hover:underline"
              >
                Mark all arranged
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMarkAllArranged(false)}
                className="text-[11px] font-semibold text-[#8C857D] hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Item Expandable Panel */}
      {isAddingOpen && (
        <form
          onSubmit={handleCreateCustom}
          className="bg-[#FDFBF7] border border-[#D1654B]/30 rounded-[18px] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#1A1A1A]">Add Extra Grocery Item</span>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="text-[11px] text-[#8C857D] hover:text-[#1A1A1A]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Item name (e.g. Amul Milk, Whole Bread)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="sm:col-span-2 h-[40px] px-3 rounded-[10px] border border-[#EBE3D5] bg-white text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#D1654B]"
              autoFocus
            />
            <input
              type="text"
              placeholder="Qty (e.g. 500ml)"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="h-[40px] px-3 rounded-[10px] border border-[#EBE3D5] bg-white text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#D1654B]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as GroceryCategory)}
              className="h-[36px] px-2.5 rounded-[10px] border border-[#EBE3D5] bg-white text-[12px] font-medium text-[#1A1A1A] focus:outline-none"
            >
              <option value="Produce & Veggies">Produce & Veggies</option>
              <option value="Dairy & Protein">Dairy & Protein</option>
              <option value="Grains, Lentils & Flours">Grains, Lentils & Flours</option>
              <option value="Pantry & Spices">Pantry & Spices</option>
              <option value="Other">Other Household</option>
            </select>

            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="h-[36px] px-4 rounded-[10px] bg-[#D1654B] text-white text-[12px] font-bold disabled:opacity-50 transition-opacity"
            >
              Add to Grocery
            </button>
          </div>
        </form>
      )}

      {/* Search & Grouping Bar */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#8C857D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[36px] pl-8 pr-3 rounded-[12px] bg-white border border-[#EBE3D5] text-[12px] text-[#1A1A1A] placeholder:text-[#8C857D] focus:outline-none focus:border-[#D1654B]"
          />
        </div>

        {/* Group by switch: Category vs Day */}
        <button
          type="button"
          onClick={() => setGroupMode(groupMode === "category" ? "day" : "category")}
          className="inline-flex items-center gap-1.5 px-3 h-[36px] text-[11px] font-bold rounded-[12px] border border-[#EBE3D5] bg-white text-[#635E58] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors shrink-0"
        >
          {groupMode === "category" ? (
            <>
              <Calendar className="w-3.5 h-3.5 text-[#D1654B]" />
              <span>Group by Day</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-[#D1654B]" />
              <span>Group by Category</span>
            </>
          )}
        </button>
      </div>

      {/* Grocery Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-[#EBE3D5] rounded-[20px] p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EAF3EB] text-[#246337] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-[16px] font-bold text-[#1A1A1A]">No items found</h4>
          <p className="text-[13px] text-[#8C857D] max-w-xs mx-auto">
            No ingredients match your search query.
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[12px] font-bold text-[#D1654B] hover:underline pt-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : groupMode === "category" ? (
        /* Render Grouped by Category */
        <div className="space-y-5">
          {Array.from(groupedByCategory.entries()).map(([category, catItems]) => {
            const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${catColor.bg} ${catColor.text} ${catColor.border}`}
                  >
                    {category}
                  </span>
                  <span className="text-[11px] text-[#8C857D] font-medium">
                    {catItems.filter((i) => i.arranged).length}/{catItems.length} arranged
                  </span>
                </div>

                <div className="bg-white border border-[#EBE3D5] rounded-[18px] divide-y divide-[#F3EFE7] shadow-xs overflow-hidden">
                  {catItems.map((item) => (
                    <GroceryItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => onToggleArranged(item.id)}
                      onRemove={item.isCustom ? () => onRemoveCustomItem(item.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Render Grouped by Day */
        <div className="space-y-5">
          {Array.from(groupedByDay.entries()).map(([dayLabel, dayItems]) => (
            <div key={dayLabel} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D1654B]" />
                  <span className="text-[13px] font-bold text-[#1A1A1A]">{dayLabel}</span>
                </div>
                <span className="text-[11px] text-[#8C857D] font-medium">
                  {dayItems.filter((i) => i.arranged).length}/{dayItems.length} arranged
                </span>
              </div>

              <div className="bg-white border border-[#EBE3D5] rounded-[18px] divide-y divide-[#F3EFE7] shadow-xs overflow-hidden">
                {dayItems.map((item) => (
                  <GroceryItemRow
                    key={`${dayLabel}-${item.id}`}
                    item={item}
                    onToggle={() => onToggleArranged(item.id)}
                    onRemove={item.isCustom ? () => onRemoveCustomItem(item.id) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: () => void;
  onRemove?: () => void;
}

const GroceryItemRow: React.FC<GroceryItemRowProps> = ({
  item,
  onToggle,
  onRemove,
}) => {
  return (
    <div
      className={`p-3.5 flex items-start gap-3 transition-colors ${
        item.arranged ? "bg-[#FAF8F5]/60 opacity-60" : "bg-white hover:bg-[#FDFBF7]"
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-6 h-6 rounded-[8px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer active:scale-90 ${
          item.arranged
            ? "bg-[#2B6A42] border-[#2B6A42] text-white"
            : "border-[#CFC6B8] bg-[#FDFBF7] hover:border-[#D1654B]"
        }`}
        aria-label={`Mark ${item.name} as ${item.arranged ? "pending" : "arranged"}`}
      >
        {item.arranged && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[14px] font-semibold leading-tight ${
              item.arranged ? "line-through text-[#8C857D]" : "text-[#1A1A1A]"
            }`}
          >
            {item.name}
          </span>
          {item.quantity && (
            <span className="text-[11px] font-medium text-[#8C857D] bg-[#F3EFE7] px-2 py-0.5 rounded-full">
              {item.quantity}
            </span>
          )}
        </div>
      </div>

      {/* Delete button if custom */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-[#8C857D] hover:text-[#D1654B] p-1 rounded-full transition-colors shrink-0"
          title="Remove custom item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
