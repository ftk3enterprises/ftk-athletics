// localStorage JSON helper. Business data (auth, families, registrations,
// payments, waivers, sponsor inquiries) now lives in Supabase — this file
// only backs the in-progress registration wizard draft, which is pure
// client UI state and has no reason to be in the database.

const isBrowser = () => typeof window !== "undefined";

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Small artificial delay so loading states are visible for code-backed (non-Supabase) reads. */
export function networkDelay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const STORAGE_KEYS = {
  registrationDraft: "ftk_registration_draft",
} as const;

/**
 * Scoped per signed-in user so a shared browser never lets one account's
 * in-progress registration (participants, programs, session picks) show up
 * for a different account that signs in afterward. Never call this with an
 * unauthenticated/unknown user — the draft context only reads/writes once
 * it actually knows who's signed in.
 */
export function registrationDraftKey(userId: string): string {
  return `${STORAGE_KEYS.registrationDraft}:${userId}`;
}
