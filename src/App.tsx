import React, { useState, useEffect } from "react";
import { Screen, UserPreferences, DayPlan, UserProfile } from "./types";
import {
  getStoredPreferences,
  setStoredPreferences,
  getIsCalibrationDone,
  setIsCalibrationDone,
  getStoredCalibratedDishes,
  setStoredCalibratedDishes,
  getStoredPlan,
  setStoredPlan,
  getStoredUser,
  setStoredUser,
  getStoredIsLocked,
  setStoredIsLocked,
  clearAllStorage,
  DEFAULT_PREFERENCES,
} from "./utils/storage";
import { generatePlanApi } from "./utils/api";
import {
  logEvent,
  classifyError,
  getSessionRegenerateCount,
  incrementSessionRegenerateCount,
} from "./utils/events";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { formatFirebaseUser, signOutUser } from "./utils/auth";
import { saveUserPlanToFirestore, fetchUserSavedPlan } from "./utils/plans";
import { HomeScreen } from "./components/HomeScreen";
import { PreferencesScreen } from "./components/PreferencesScreen";
import { CalibrateScreen } from "./components/CalibrateScreen";
import { PlanScreen } from "./components/PlanScreen";
import { AuthSheet } from "./components/AuthSheet";
import { MyPlanScreen } from "./components/MyPlanScreen";
import { QuickSuggestScreen } from "./components/QuickSuggestScreen";
import { GroceryScreen } from "./components/GroceryScreen";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { ProfileModal } from "./components/ProfileModal";

export default function App() {
  // State initialization with localStorage persistence
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getStoredPreferences()
  );
  const [isCalibrated, setIsCalibrated] = useState<boolean>(() =>
    getIsCalibrationDone()
  );
  const [calibratedDishes, setCalibratedDishes] = useState<string[]>(() =>
    getStoredCalibratedDishes()
  );
  const [plan, setPlan] = useState<DayPlan[]>(() => getStoredPlan() || []);
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [isLocked, setIsLocked] = useState<boolean>(() => getStoredIsLocked());
  const [preferencesMode, setPreferencesMode] = useState<"new_plan" | "add_days">("new_plan");

  // Screen routing
  const [screen, setScreen] = useState<Screen>(() => {
    const savedUser = getStoredUser();
    const savedPlan = getStoredPlan();
    if (savedUser && savedPlan && savedPlan.length > 0) {
      return "my_plan";
    }
    return "home";
  });

  // Flow & UI states
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authSheetTitle, setAuthSheetTitle] = useState("Sign in");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [swapCount, setSwapCount] = useState(0);
  const [loadingInitialPlan, setLoadingInitialPlan] = useState(false);

  // Real Firebase Auth state listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        const formatted = formatFirebaseUser(firebaseUser);
        setUser(formatted);
        setStoredUser(formatted);

        // Fetch user's saved plan from Firestore if they don't have an active one or returning in a later session
        try {
          const remotePlan = await fetchUserSavedPlan(firebaseUser.uid);
          if (remotePlan && remotePlan.length > 0) {
            setPlan(remotePlan);
            setStoredPlan(remotePlan);
            setIsLocked(true);
            setStoredIsLocked(true);
          }
        } catch (err) {
          console.warn("Error fetching remote plan on auth change:", err);
        }
      } else {
        // Not authenticated
        setUser(null);
        setStoredUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenSignIn = () => {
    setAuthSheetTitle("Sign in");
    setIsAuthSheetOpen(true);
  };

  // Sync state changes to storage
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setStoredPreferences(newPrefs);
  };

  const handleUpdatePlan = (newPlan: DayPlan[]) => {
    setPlan(newPlan);
    setStoredPlan(newPlan);
    if (user && isLocked) {
      saveUserPlanToFirestore(user.id, newPlan, preferences).catch((err) => {
        console.warn("Notice: could not save updated plan to cloud:", err);
      });
    }
  };

  // Generate a fresh plan based on user's selected duration
  const createPlan = async (prefs: UserPreferences, userDishes: string[]) => {
    setIsLocked(false);
    setStoredIsLocked(false);
    setLoadingInitialPlan(true);
    setScreen("plan");

    const numDays =
      prefs.planDuration === "1 day"
        ? 1
        : prefs.planDuration === "1 week"
        ? 7
        : 3;
    const startTime = performance.now();
    const inputText = `${(prefs.cuisines || []).join(", ")} | ${prefs.dietary || ""} | ${prefs.cookingTime || ""}`.trim();
    const currentRegenCount = getSessionRegenerateCount();

    try {
      const newPlan = await generatePlanApi(prefs, userDishes, numDays);
      handleUpdatePlan(newPlan);

      // Log only on success after model response has come back AND been successfully parsed AND rendered
      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        logEvent("weekly_plan_generate", {
          latency_ms: latency,
          plan_days: newPlan.length,
          input_text: inputText,
          regenerate_count: currentRegenCount,
        });
        incrementSessionRegenerateCount();
      });
    } catch (err: any) {
      console.error("Plan generation error:", err);
      const latency = performance.now() - startTime;
      logEvent("weekly_plan_failed", {
        latency_ms: latency,
        plan_days: numDays,
        input_text: inputText,
        regenerate_count: currentRegenCount,
        error_type: classifyError(err),
      });
    } finally {
      setLoadingInitialPlan(false);
    }
  };

  // Actions from Screen 1 (Home)
  const handlePlanMealsFromHome = () => {
    setPreferencesMode("new_plan");
    setScreen("preferences");
  };

  const handleQuickSuggestFromHome = () => {
    setScreen("quick_suggest");
  };

  // Actions from Screen 2 (Preferences)
  const handleAddDaysFromPreferences = async (
    updatedPrefs: UserPreferences,
    daysToAdd: number
  ) => {
    setPreferences(updatedPrefs);
    setStoredPreferences(updatedPrefs);

    const existingDishes = plan.flatMap((d) => d.meals.map((m) => m.dish));
    const startDayOffset = plan.length;
    const startTime = performance.now();
    const currentRegenCount = getSessionRegenerateCount();
    const inputText = `${(updatedPrefs.cuisines || []).join(", ")} | ${updatedPrefs.dietary || ""} | ${updatedPrefs.cookingTime || ""}`.trim();

    try {
      const newDays = await generatePlanApi(
        updatedPrefs,
        calibratedDishes,
        daysToAdd,
        existingDishes,
        startDayOffset
      );

      // Append new days to the existing plan (DO NOT OVERRIDE)
      const updatedPlan = [...plan, ...newDays];
      handleUpdatePlan(updatedPlan);
      setStoredPlan(updatedPlan);

      if (user) {
        saveUserPlanToFirestore(user.id, updatedPlan, updatedPrefs).catch((err) => {
          console.warn("Firestore plan sync notice:", err);
        });
      }

      setToastMessage(`Added ${daysToAdd} extra day${daysToAdd > 1 ? "s" : ""} on top of your plan! 🎉`);

      // Return to active plan screen
      if (isLocked) {
        setScreen("my_plan");
      } else {
        setScreen("plan");
      }

      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        logEvent("weekly_plan_generate", {
          latency_ms: latency,
          plan_days: updatedPlan.length,
          input_text: inputText,
          regenerate_count: currentRegenCount,
        });
        incrementSessionRegenerateCount();
      });
    } catch (err: any) {
      console.error("Add extra days from preferences error:", err);
      setToastMessage("Could not generate extra days. Please try again.");
      const latency = performance.now() - startTime;
      logEvent("weekly_plan_failed", {
        latency_ms: latency,
        plan_days: daysToAdd,
        input_text: inputText,
        regenerate_count: currentRegenCount,
        error_type: classifyError(err),
      });
      throw err;
    } finally {
      setPreferencesMode("new_plan");
    }
  };

  const handleStartFreshPlan = (prefs: UserPreferences) => {
    setPreferencesMode("new_plan");
    if (!isCalibrated) {
      setScreen("calibrate");
    } else {
      createPlan(prefs, calibratedDishes);
    }
  };

  const handleContinueFromPreferences = () => {
    if (preferencesMode === "add_days" && plan.length > 0) {
      const days =
        preferences.planDuration === "1 day"
          ? 1
          : preferences.planDuration === "1 week"
          ? 7
          : 3;
      handleAddDaysFromPreferences(preferences, days);
      return;
    }

    if (!isCalibrated) {
      setScreen("calibrate");
    } else {
      createPlan(preferences, calibratedDishes);
    }
  };

  // Actions from Screen 3 (Calibration)
  const handleCalibrationComplete = (selectedDishes: string[]) => {
    setIsCalibrated(true);
    setIsCalibrationDone(true);
    setCalibratedDishes(selectedDishes);
    setStoredCalibratedDishes(selectedDishes);
    createPlan(preferences, selectedDishes);
  };

  const handleCalibrationSkip = () => {
    setIsCalibrated(true);
    setIsCalibrationDone(true);
    createPlan(preferences, calibratedDishes);
  };

  // Actions from Screen 4 (Plan)
  const handleLockPlan = async () => {
    // Requirements: "The plan must survive this step. Persist to localStorage before triggering auth."
    setStoredPlan(plan);

    if (user) {
      // Already logged in with real Firebase account
      setIsLocked(true);
      setStoredIsLocked(true);
      setScreen("my_plan");
      setToastMessage("Your plan is locked and ready!");
      // Save to Firestore
      try {
        await saveUserPlanToFirestore(user.id, plan, preferences);
      } catch (err) {
        console.warn("Firestore plan save notice:", err);
      }
    } else {
      setAuthSheetTitle("Sign in");
      setIsAuthSheetOpen(true);
    }
  };

  const handleToggleLock = (locked?: boolean) => {
    const nextLocked = typeof locked === "boolean" ? locked : !isLocked;
    setIsLocked(nextLocked);
    setStoredIsLocked(nextLocked);
    setToastMessage(
      nextLocked
        ? "Plan locked. Meal substitutions are locked in."
        : "Plan unlocked. Alternate suggestions enabled."
    );
  };

  const handleAuthSuccess = async (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser);
    setIsAuthSheetOpen(false);

    if (plan && plan.length > 0) {
      setStoredPlan(plan);
      setIsLocked(true);
      setStoredIsLocked(true);
      setScreen("my_plan");
      setToastMessage(`Welcome, ${authenticatedUser.name}! Your plan has been saved.`);

      // Complete the save they originally intended to Firestore without making them start over
      try {
        await saveUserPlanToFirestore(authenticatedUser.id, plan, preferences);
      } catch (err) {
        console.warn("Firestore plan save notice:", err);
      }
    } else {
      setToastMessage(`Welcome, ${authenticatedUser.name}!`);
      // If user had a previously saved plan in Firestore, load it
      try {
        const remotePlan = await fetchUserSavedPlan(authenticatedUser.id);
        if (remotePlan && remotePlan.length > 0) {
          setPlan(remotePlan);
          setStoredPlan(remotePlan);
          setIsLocked(true);
          setStoredIsLocked(true);
          setScreen("my_plan");
        }
      } catch (err) {
        console.warn("Firestore fetch notice:", err);
      }
    }
  };

  const handleLogout = async () => {
    // Keep anon_id intact! clearAllStorage clears other keys but keeps anon_id.
    clearAllStorage();
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Firebase sign out error:", err);
    }
    setUser(null);
    setIsLocked(false);
    setPlan([]);
    setPreferences(DEFAULT_PREFERENCES);
    setIsCalibrated(false);
    setIsCalibrationDone(false);
    setCalibratedDishes([]);
    setScreen("home");
    setToastMessage("Logged out successfully.");
  };

  // Screen 6, 7 & Grocery Bottom Navigation logic
  const showBottomNav =
    (screen === "my_plan" || screen === "quick_suggest" || screen === "grocery") &&
    (user !== null || isLocked || plan.length > 0);

  return (
    <div className="min-h-screen bg-[#F3EFE7] text-[#1A1A1A] flex justify-center selection:bg-[#D1654B]/20 selection:text-[#D1654B] py-0 sm:py-4">
      {/* Mobile-first centered frame with 390-420px viewport, rounded-32px on desktop and Natural Tones border */}
      <main className="w-full max-w-[420px] min-h-screen sm:min-h-[844px] bg-[#FDFBF7] shadow-2xl sm:rounded-[32px] overflow-hidden flex flex-col relative border border-[#EBE3D5]">
        {/* Active Toast Notification */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Screens */}
        {screen === "home" && (
          <HomeScreen
            onPlanMeals={handlePlanMealsFromHome}
            onQuickSuggest={handleQuickSuggestFromHome}
            hasExistingPlan={plan.length > 0 && isLocked}
            onViewExistingPlan={() => setScreen("my_plan")}
            user={user}
            onOpenProfile={() => {
              if (user) {
                setIsProfileModalOpen(true);
              } else {
                handleOpenSignIn();
              }
            }}
          />
        )}

        {screen === "preferences" && (
          <PreferencesScreen
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onContinue={handleContinueFromPreferences}
            onBack={() => {
              if (preferencesMode === "add_days" && plan.length > 0) {
                setScreen(isLocked ? "my_plan" : "plan");
              } else {
                setScreen("home");
              }
            }}
            mode={preferencesMode}
            existingPlanLength={plan.length}
            onAddDays={handleAddDaysFromPreferences}
            onStartFreshPlan={handleStartFreshPlan}
          />
        )}

        {screen === "calibrate" && (
          <CalibrateScreen
            preferences={preferences}
            onComplete={handleCalibrationComplete}
            onSkip={handleCalibrationSkip}
            onBackToHome={() => setScreen("home")}
          />
        )}

        {screen === "plan" && (
          <PlanScreen
            plan={plan}
            preferences={preferences}
            dishesMade={calibratedDishes}
            onUpdatePlan={handleUpdatePlan}
            onLockPlan={handleLockPlan}
            onEditPreferences={() => {
              setPreferencesMode(plan.length > 0 ? "add_days" : "new_plan");
              setScreen("preferences");
            }}
            onShowToast={(msg) => setToastMessage(msg)}
            swapCount={swapCount}
            onIncrementSwap={() => setSwapCount((prev) => prev + 1)}
            loadingInitial={loadingInitialPlan}
            onBackToHome={() => setScreen("home")}
            isLocked={isLocked}
          />
        )}

        {screen === "my_plan" && (
          <MyPlanScreen
            plan={plan}
            user={user}
            preferences={preferences}
            dishesMade={calibratedDishes}
            onUpdatePlan={handleUpdatePlan}
            onPlanMoreDays={() => {
              setPreferencesMode("new_plan");
              setScreen("preferences");
            }}
            onShowToast={(msg) => setToastMessage(msg)}
            onLogout={handleLogout}
            swapCount={swapCount}
            onIncrementSwap={() => setSwapCount((prev) => prev + 1)}
            onGoHome={() => setScreen("home")}
            onOpenGrocery={() => setScreen("grocery")}
            onOpenProfile={() => {
              if (user) {
                setIsProfileModalOpen(true);
              } else {
                handleOpenSignIn();
              }
            }}
            isLocked={isLocked}
            onToggleLock={handleToggleLock}
            onEditPreferences={() => {
              setPreferencesMode("add_days");
              setScreen("preferences");
            }}
          />
        )}

        {screen === "grocery" && (
          <GroceryScreen
            plan={plan}
            onBack={() => setScreen("my_plan")}
            onShowToast={(msg) => setToastMessage(msg)}
          />
        )}

        {screen === "quick_suggest" && (
          <QuickSuggestScreen
            preferences={preferences}
            onBack={() => setScreen(user ? "my_plan" : "home")}
          />
        )}

        {/* Persistent Bottom Bar for My Plan & Quick Suggest */}
        {showBottomNav && (
          <BottomNav
            currentScreen={screen}
            isLoggedIn={user !== null}
            onNavigate={(targetScreen) => {
              if (targetScreen === "my_plan" && plan.length === 0) {
                setScreen("preferences");
              } else {
                setScreen(targetScreen);
              }
            }}
          />
        )}
      </main>

      {/* Screen 5: Auth Sheet Modal (Rendered outside main to avoid container overflow clipping) */}
      <AuthSheet
        isOpen={isAuthSheetOpen}
        title={authSheetTitle}
        onClose={() => setIsAuthSheetOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        user={user}
        plan={plan}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={handleLogout}
        onViewPlan={() => setScreen("my_plan")}
      />
    </div>
  );
}
