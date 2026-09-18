import React from "react";
import { UserProfile, DayPlan } from "../types";
import { X, LogOut, Calendar, Mail, User as UserIcon, ArrowRight } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  plan: DayPlan[];
  onClose: () => void;
  onLogout: () => void;
  onViewPlan: () => void;
}

export function ProfileModal({
  isOpen,
  user,
  plan,
  onClose,
  onLogout,
  onViewPlan,
}: ProfileModalProps) {
  if (!isOpen || !user) return null;

  const totalMeals = plan.reduce((acc, day) => acc + day.meals.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-[360px] bg-[#FDFBF7] rounded-[28px] p-6 shadow-2xl border border-[#EBE3D5] animate-in zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE3D5]/60">
          <span className="text-[12px] font-bold text-[#8C857D] uppercase tracking-wider">
            Your Profile
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] transition-colors cursor-pointer"
            aria-label="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="py-5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#D1654B] text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-[#D1654B]/20 mb-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-[20px] font-serif font-bold text-[#1A1A1A] leading-snug">
            {user.name}
          </h3>
          <p className="text-[13px] text-[#8C857D] flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </p>
        </div>

        {/* Active plan status */}
        <div className="bg-white border border-[#EBE3D5] rounded-[18px] p-4 mb-5 shadow-2xs">
          <div className="flex items-center justify-between text-left">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D1654B]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Meal Plan</span>
              </div>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">
                {plan.length > 0
                  ? `${plan.length} day${plan.length > 1 ? "s" : ""} • ${totalMeals} meal${totalMeals > 1 ? "s" : ""}`
                  : "No active meal plan"}
              </p>
            </div>
            {plan.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewPlan();
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#D1654B] hover:text-[#B84E36] px-2.5 py-1.5 rounded-full hover:bg-[#FAF0ED] transition-colors cursor-pointer"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Logout action */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full py-3 px-4 rounded-[14px] bg-[#FAF0ED] hover:bg-[#FEE2E2] text-[#DC2626] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
