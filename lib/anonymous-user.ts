/**
 * Client-only persistent anonymous identity (localStorage).
 * Reserved for future account linking / migration — no backend in MVP.
 */

export const ANONYMOUS_USER_ID_STORAGE_KEY = "anonymousUserId";

function generateAnonymousUserId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    const hex = crypto.randomUUID().replace(/-/g, "");
    return `usr_${hex.slice(0, 8)}`;
  }
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += Math.floor(Math.random() * 16).toString(16);
  }
  return `usr_${suffix}`;
}

/**
 * Ensures an ID exists in localStorage and returns it.
 * Call once at app bootstrap (client). Returns null during SSR.
 */
export function initializeAnonymousUser(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(
      ANONYMOUS_USER_ID_STORAGE_KEY
    );
    if (existing) return existing;

    const id = generateAnonymousUserId();
    window.localStorage.setItem(ANONYMOUS_USER_ID_STORAGE_KEY, id);
    return id;
  } catch {
    // private mode / quota — still return a session-stable id from memory is out of scope; return null
    return null;
  }
}

/**
 * Returns the persisted anonymous user id, or null if unavailable (SSR, not initialized, or storage blocked).
 */
export function getAnonymousUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ANONYMOUS_USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}
