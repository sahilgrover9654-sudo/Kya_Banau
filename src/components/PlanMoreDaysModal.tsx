import React, { useState } from "react";
import { Sparkles, Calendar, X, Plus, Clock, Check, SlidersHorizontal, Pencil } from "lucide-react";
import { formatDayWithDate } from "../utils/dates";
import { UserPreferences } from "../types";

interface PlanMoreDaysModalProps {
  currentPlanLength: number;
  lastDate?: Date;
  preferences?: UserPreferences;
  onEditPreferences?: () => void;
  onAddDays: (numDays: number) => Promise<void>;
  onClose: () => void;
}

const PRESET_DAYS = [
  { days: 1, label: "+1 Day", desc: "Quick extension" },
  { days: 2, label: "+2 Days", desc: "Weekend fuel" },
  { days: 3, label: "+3 Days", desc: "Most popular" },
  { days: 4, label: "+4 Days", desc: "Full work week" },
  { days: 7, label: "+1 Week", desc: "7 fresh days" },
];

export function PlanMoreDaysModal({
  currentPlanLength,
  lastDate = new Date(),
  preferences,
  onEditPreferences,
  onAddDays,
  onClose,
}: PlanMoreDaysModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute preview dates
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() + 1);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + selectedDays - 1);

  const startFormatted = formatDayWithDate(startDate);
  const endFormatted = formatDayWithDate(endDate);

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      await onAddDays(selectedDays);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-[#EBE3D5] rounded-[24px] max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#D1654B] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[20px] font-serif font-bold text-[#1A1A1A] leading-tight">
                Plan More Days
              </h3>
              <p className="text-[12px] text-[#8C857D] mt-0.5">
                Add extra days to your current plan without resetting it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Preferences Summary & Edit CTA */}
        {preferences && (
          <div
            id="plan-more-preferences-card"
            className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-[16px] p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#635E58]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D1654B]" />
                <span>Your Selected Preferences</span>
              </div>
              {onEditPreferences && (
                <button
                  id="plan-more-edit-preferences-cta"
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditPreferences();
                  }}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#D1654B] hover:text-[#B84E36] hover:underline cursor-pointer"
                  title="Modify preferences and regenerate suggestions"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Preferences</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {preferences.dietary && (
                <span className="inline-flex items-center text-[11px] font-semibold bg-white border border-[#EBE3D5] text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {preferences.dietary}
                </span>
              )}
              {preferences.cuisines && preferences.cuisines.length > 0 && (
                <span className="inline-flex items-center text-[11px] font-semibold bg-white border border-[#EBE3D5] text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {preferences.cuisines.join(", ")}
                </span>
              )}
              {preferences.cookingTime && (
                <span className="inline-flex items-center text-[11px] font-semibold bg-white border border-[#EBE3D5] text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {preferences.cookingTime}
                </span>
              )}
              {preferences.calorieGoal && preferences.calorieGoal !== "Flexible" && (
                <span className="inline-flex items-center text-[11px] font-semibold bg-white border border-[#EBE3D5] text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {preferences.calorieGoal}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Days preset pills */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#635E58] block">
            How many extra days?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_DAYS.map((preset) => {
              const isSelected = selectedDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setSelectedDays(preset.days)}
                  className={`p-3 rounded-[14px] border text-left transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-[#FAF0ED] border-[#D1654B] text-[#D1654B] shadow-xs ring-1 ring-[#D1654B]/30"
                      : "bg-[#FDFBF7] border-[#EBE3D5] text-[#1A1A1A] hover:border-[#D1654B]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold">{preset.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#D1654B]" />}
                  </div>
                  <span className={`text-[11px] block mt-0.5 ${isSelected ? "text-[#D1654B]/80" : "text-[#8C857D]"}`}>
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date preview callout */}
        <div className="bg-[#FDFBF7] border border-[#EBE3D5] rounded-[16px] p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#D1654B] shrink-0" />
          <div className="text-[13px] leading-snug">
            <span className="text-[#8C857D] block text-[11px] font-medium">Adding to your plan:</span>
            <span className="font-bold text-[#1A1A1A]">
              {selectedDays === 1 ? startFormatted : `${startFormatted} → ${endFormatted}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#8C857D] hover:text-[#1A1A1A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-[12px] bg-[#D1654B] hover:bg-[#B84E36] text-white text-[13px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Generating {selectedDays} Days...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add {selectedDays} Day{selectedDays > 1 ? "s" : ""} to Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
