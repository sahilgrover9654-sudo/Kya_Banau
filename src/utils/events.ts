import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export type EventName =
  | "weekly_plan_generate"
  | "quick_meal_generate"
  | "weekly_plan_failed"
  | "quick_meal_failed"
  | "auth_linked";

export type ErrorType =
  | "api_error"
  | "parse_error"
  | "timeout"
  | "empty_response";

export interface ExtraEventFields {
  latency_ms?: number;
  model?: string;
  country?: string | null;
  plan_days?: number | null;
  input_text?: string | null;
  regenerate_count?: number | null;
  ingredients_input?: string | null;
  suggestions_returned?: number | null;
  error_type?: ErrorType | null;
  auth_provider?: string | null;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Persistent anonymous ID stored in localStorage under 'anon_id'
export function getAnonId(): string {
  try {
    let anonId = localStorage.getItem("anon_id");
    if (!anonId) {
      anonId = generateUUID();
      localStorage.setItem("anon_id", anonId);
    }
    return anonId;
  } catch {
    return generateUUID();
  }
}

// Fresh session ID per page load, not persisted
const SESSION_ID: string = generateUUID();
export function getSessionId(): string {
  return SESSION_ID;
}

// Session regeneration counter tracking for weekly plan regenerations
let memoryRegenCount = 0;
export function getSessionRegenerateCount(): number {
  try {
    const stored = sessionStorage.getItem("kb_session_regen_count");
    if (stored !== null) {
      return parseInt(stored, 10) || 0;
    }
    return memoryRegenCount;
  } catch {
    return memoryRegenCount;
  }
}

export function incrementSessionRegenerateCount(): number {
  const next = getSessionRegenerateCount() + 1;
  try {
    sessionStorage.setItem("kb_session_regen_count", String(next));
  } catch {
    memoryRegenCount = next;
  }
  return next;
}

let latestServerCountry: string | null = null;
let latestServerModel: string = "gemini-3.1-flash-lite";

export function setServerMeta(meta?: { country?: string | null; model?: string }) {
  if (meta?.country !== undefined) {
    latestServerCountry = meta.country;
  }
  if (meta?.model) {
    latestServerModel = meta.model;
  }
}

function getPlatform(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

function getViewport(): string {
  if (typeof window === "undefined") return "0x0";
  return `${window.innerWidth}x${window.innerHeight}`;
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getLocale(): string {
  try {
    return navigator.language || "en-US";
  } catch {
    return "en-US";
  }
}

function getOS(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Linux/i.test(ua)) return "Linux";
  return null;
}

function getBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/MSIE|Trident\//i.test(ua)) return "Internet Explorer";
  return null;
}

function getReferrer(): string | null {
  if (typeof document === "undefined") return null;
  return document.referrer || null;
}

export function classifyError(err: any): ErrorType {
  const msg = String(err?.message || err || "").toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("json") || msg.includes("parse") || msg.includes("syntaxerror")) return "parse_error";
  if (msg.includes("empty") || msg.includes("no content")) return "empty_response";
  return "api_error";
}

/**
 * Single reusable function logEvent(eventName, extraFields) that fills every
 * common field automatically, so adding an event later is one line.
 * Fire-and-forget: a logging failure must never block, delay, or error the user-facing flow.
 */
export async function logEvent(
  eventName: EventName,
  extraFields: ExtraEventFields
): Promise<void> {
  try {
    // Identity & Auth evaluation: strictly real Firebase Auth
    const realUser = auth?.currentUser;

    let auth_state: "signed_in" | "anonymous" = "anonymous";
    let user_id: string | null = null;
    const mock_user_id: string | null = null; // Always null from now on
    let user_email: string | null = null;

    if (realUser && !realUser.isAnonymous) {
      auth_state = "signed_in";
      user_id = realUser.uid;
      user_email = realUser.email || null;
    } else {
      auth_state = "anonymous";
      user_id = null;
      user_email = null;
    }

    const payload = {
      // Always present — never null
      event_name: eventName,
      anon_id: getAnonId(),
      session_id: getSessionId(),
      auth_state: auth_state,
      created_at: serverTimestamp(),
      latency_ms: Math.max(0, Math.round(extraFields.latency_ms || 0)),
      model: extraFields.model || latestServerModel || "gemini-3.1-flash-lite",
      platform: getPlatform(),
      viewport: getViewport(),
      timezone: getTimezone(),
      locale: getLocale(),

      // Best-effort — write null if unavailable, never omit the field and never invent a value
      user_id: user_id,
      mock_user_id: mock_user_id,
      user_email: user_email,
      os: getOS(),
      browser: getBrowser(),
      country: extraFields.country !== undefined ? extraFields.country : latestServerCountry,
      referrer: getReferrer(),

      // Per-event fields — write value or null
      plan_days: extraFields.plan_days !== undefined ? extraFields.plan_days : null,
      input_text: extraFields.input_text !== undefined ? extraFields.input_text : null,
      regenerate_count:
        extraFields.regenerate_count !== undefined ? extraFields.regenerate_count : null,
      ingredients_input:
        extraFields.ingredients_input !== undefined ? extraFields.ingredients_input : null,
      suggestions_returned:
        extraFields.suggestions_returned !== undefined
          ? extraFields.suggestions_returned
          : null,
      error_type: extraFields.error_type !== undefined ? extraFields.error_type : null,
    };

    // Fire-and-forget write to Firestore 'events' collection
    if (db) {
      const eventsCol = collection(db, "events");
      addDoc(eventsCol, payload).catch((writeErr) => {
        // Silent catch: logging failure must never block or error user flow
        console.warn("Firestore event log notice:", writeErr);
      });
    }
  } catch (err) {
    // Top-level catch to ensure zero interference with the user experience
    console.warn("logEvent fire-and-forget error:", err);
  }
}

/**
 * When a user signs in, write an 'auth_linked' event linking their persistent anon_id
 * with their newly authenticated real user_id and email.
 */
export async function logAuthLinked(
  userId: string,
  userEmail: string | null,
  provider: string = "google.com"
): Promise<void> {
  try {
    const payload = {
      event_name: "auth_linked",
      anon_id: getAnonId(),
      session_id: getSessionId(),
      auth_state: "signed_in",
      created_at: serverTimestamp(),
      latency_ms: 0,
      model: latestServerModel || "gemini-3.1-flash-lite",
      platform: getPlatform(),
      viewport: getViewport(),
      timezone: getTimezone(),
      locale: getLocale(),
      user_id: userId,
      mock_user_id: null,
      user_email: userEmail,
      os: getOS(),
      browser: getBrowser(),
      country: latestServerCountry,
      referrer: getReferrer(),
      plan_days: null,
      input_text: null,
      regenerate_count: null,
      ingredients_input: null,
      suggestions_returned: null,
      error_type: null,
      auth_provider: provider,
    };

    if (db) {
      const eventsCol = collection(db, "events");
      await addDoc(eventsCol, payload);
    }
  } catch (err) {
    console.warn("logAuthLinked notice:", err);
  }
}
