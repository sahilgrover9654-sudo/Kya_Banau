import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { DayPlan, UserPreferences, UserPreferenceMemory } from "../types";

export interface SavedPlanDocument {
  id: string;
  user_id: string;
  plan: DayPlan[];
  preferences?: UserPreferences;
  created_at: any;
  updated_at: any;
}

/**
 * Save or update a user's active plan to Firestore in the 'plans' collection.
 * Uses a deterministic doc id per user (e.g. `plan_${userId}`) or adds new document.
 * Here we use user-scoped document ID `plan_${userId}` so fetching the latest plan is fast,
 * and security rules require request.resource.data.user_id == request.auth.uid.
 */
export async function saveUserPlanToFirestore(
  userId: string,
  plan: DayPlan[],
  preferences?: UserPreferences
): Promise<string | null> {
  if (!db || !userId) return null;
  try {
    const planDocRef = doc(db, "plans", `plan_${userId}`);
    await setDoc(
      planDocRef,
      {
        user_id: userId,
        plan,
        preferences: preferences || null,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
    return planDocRef.id;
  } catch (err) {
    console.error("Failed to save plan to Firestore:", err);
    throw err;
  }
}

/**
 * Fetch a user's saved plan from Firestore.
 */
export async function fetchUserSavedPlan(userId: string): Promise<DayPlan[] | null> {
  if (!db || !userId) return null;
  try {
    const planDocRef = doc(db, "plans", `plan_${userId}`);
    const { getDoc } = await import("firebase/firestore");
    const snapshot = await getDoc(planDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data?.plan) && data.plan.length > 0) {
        return data.plan as DayPlan[];
      }
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch user plan from Firestore:", err);
    return null;
  }
}

/**
 * Save user preference memory (onboarding picks, locked items, edited dishes, rejected dishes) to Firestore
 */
export async function saveUserPreferencesToFirestore(
  userId: string,
  memory: UserPreferenceMemory
): Promise<void> {
  if (!db || !userId) return;
  try {
    const prefDocRef = doc(db, "user_preferences", userId);
    await setDoc(
      prefDocRef,
      {
        user_id: userId,
        onboarding_picks: memory.onboarding_picks || [],
        locked_items: memory.locked_items || [],
        edited_dishes: memory.edited_dishes || [],
        rejected_dishes: memory.rejected_dishes || [],
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Failed to save user preferences to Firestore:", err);
  }
}

/**
 * Fetch user preference memory from Firestore
 */
export async function fetchUserPreferencesFromFirestore(
  userId: string
): Promise<UserPreferenceMemory | null> {
  if (!db || !userId) return null;
  try {
    const prefDocRef = doc(db, "user_preferences", userId);
    const { getDoc } = await import("firebase/firestore");
    const snapshot = await getDoc(prefDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        onboarding_picks: Array.isArray(data.onboarding_picks) ? data.onboarding_picks : [],
        locked_items: Array.isArray(data.locked_items) ? data.locked_items : [],
        edited_dishes: Array.isArray(data.edited_dishes) ? data.edited_dishes : [],
        rejected_dishes: Array.isArray(data.rejected_dishes) ? data.rejected_dishes : [],
      };
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch user preferences from Firestore:", err);
    return null;
  }
}
