import React from "react";
import { Home, CalendarDays, Sparkles, ShoppingBag } from "lucide-react";
import { Screen } from "../types";

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isLoggedIn?: boolean;
}

export function BottomNav({ currentScreen, onNavigate, isLoggedIn }: BottomNavProps) {
  const isHomeTab = currentScreen === "home";
  const isPlanTab = currentScreen === "my_plan" || currentScreen === "plan";
  const isGroceryTab = currentScreen === "grocery";
  const isQuickTab = currentScreen === "quick_suggest";

  // When logged in: My Plan, Grocery, Quick Suggestion
  if (isLoggedIn) {
    return (
      <nav
        id="bottom-persistent-nav"
        aria-label="Main Navigation"
        className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto h-[64px] bg-white/95 backdrop-blur-md border-t border-[#F3EFE7] px-4 z-40 flex items-center justify-around shadow-sm"
      >
        <button
          id="nav-my-plan-tab"
          type="button"
          onClick={() => onNavigate("my_plan")}
          className={`flex-1 max-w-[120px] flex flex-col items-center justify-center min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            isPlanTab
              ? "text-[#D1654B] font-bold opacity-100"
              : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
          }`}
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">My Plan</span>
        </button>

        <button
          id="nav-grocery-tab"
          type="button"
          onClick={() => onNavigate("grocery")}
          className={`flex-1 max-w-[120px] flex flex-col items-center justify-center min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            isGroceryTab
              ? "text-[#D1654B] font-bold opacity-100"
              : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Grocery</span>
        </button>

        <button
          id="nav-quick-suggest-tab"
          type="button"
          onClick={() => onNavigate("quick_suggest")}
          className={`flex-1 max-w-[120px] flex flex-col items-center justify-center min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            isQuickTab
              ? "text-[#D1654B] font-bold opacity-100"
              : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Quick Suggestion</span>
        </button>
      </nav>
    );
  }

  return (
    <nav
      id="bottom-persistent-nav"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto h-[64px] bg-white/95 backdrop-blur-md border-t border-[#F3EFE7] px-2 z-40 flex items-center justify-around shadow-sm"
    >
      <button
        id="nav-home-tab"
        type="button"
        onClick={() => onNavigate("home")}
        className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition-all ${
          isHomeTab
            ? "text-[#D1654B] font-bold opacity-100"
            : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] tracking-tight">Home</span>
      </button>

      <button
        id="nav-my-plan-tab"
        type="button"
        onClick={() => onNavigate("my_plan")}
        className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition-all ${
          isPlanTab
            ? "text-[#D1654B] font-bold opacity-100"
            : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
        }`}
      >
        <CalendarDays className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] tracking-tight">My Plan</span>
      </button>

      <button
        id="nav-grocery-tab"
        type="button"
        onClick={() => onNavigate("grocery")}
        className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition-all ${
          isGroceryTab
            ? "text-[#D1654B] font-bold opacity-100"
            : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
        }`}
      >
        <ShoppingBag className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] tracking-tight">Grocery</span>
      </button>

      <button
        id="nav-quick-suggest-tab"
        type="button"
        onClick={() => onNavigate("quick_suggest")}
        className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition-all ${
          isQuickTab
            ? "text-[#D1654B] font-bold opacity-100"
            : "text-[#8C857D] font-medium opacity-60 hover:opacity-100"
        }`}
      >
        <Sparkles className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] tracking-tight">Quick Suggestion</span>
      </button>
    </nav>
  );
}
