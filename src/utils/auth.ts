import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { UserProfile } from "../types";
import { logAuthLinked } from "./events";

export function formatFirebaseUser(user: User): UserProfile {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar:
      user.photoURL ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        user.displayName || user.email || "U"
      )}&backgroundColor=D1654B&textColor=ffffff`,
  };
}

export interface AuthErrorResult {
  message: string;
  code: string;
}

export function parseAuthError(error: any): AuthErrorResult {
  const code = error?.code || "";
  let message = "An error occurred during sign-in. Please try again.";

  if (code === "auth/popup-blocked") {
    message = "Popup was blocked by your browser. Please allow popups for this site and try again.";
  } else if (code === "auth/popup-closed-by-user") {
    message = "Sign-in was cancelled because the Google popup was closed before completing.";
  } else if (code === "auth/cancelled-popup-request") {
    message = "A previous sign-in request was cancelled. Please click sign in again.";
  } else if (code === "auth/network-request-failed") {
    message = "Network connection failed mid-flow. Please check your connection and try again.";
  } else if (
    code === "auth/admin-restricted-operation" ||
    code === "auth/user-disabled" ||
    code === "auth/operation-not-allowed"
  ) {
    message =
      "Sign-in was blocked by Google Workspace admin policy or provider settings in Firebase Console.";
  } else if (code === "auth/unauthorized-domain") {
    message =
      "This domain is not authorized in Firebase Authentication. Add this app domain to Authorized Domains in the Firebase Console.";
  } else if (error?.message) {
    message = error.message;
  }

  return { message, code };
}

/**
 * Perform real Google Sign-In using Firebase Auth SDK signInWithPopup.
 * Emits 'auth_linked' event on success.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const profile = formatFirebaseUser(result.user);

  // Emit auth_linked event joining anon_id and real user_id
  logAuthLinked(result.user.uid, result.user.email || null, "google.com");

  return profile;
}

/**
 * Sign out from Firebase Auth. Keeps anon_id intact in localStorage.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
