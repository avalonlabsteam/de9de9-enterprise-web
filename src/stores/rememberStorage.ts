import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** The persisted stores that together make up a session. */
export const SESSION_STORE_KEYS = {
  auth: 'de9de9-entreprise-auth',
  accueil: 'de9de9-accueil',
  onboarding: 'de9de9-onboarding',
} as const;

/**
 * « Rester connecté » at the last sign-in: '0' keeps the session in this tab's
 * sessionStorage (gone with the browser), anything else in localStorage. The
 * flag itself lives in localStorage so a reload knows where to look.
 */
export const REMEMBER_KEY = 'de9de9-remember';

function remembers(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

/** Picked on every call, not once: the flag changes at each sign-in. */
const pickedStorage: StateStorage = {
  getItem: (name) => {
    try {
      return (remembers() ? localStorage : sessionStorage).getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      (remembers() ? localStorage : sessionStorage).setItem(name, value);
    } catch {
      /* storage blocked or full: the session still lives in memory */
    }
  },
  removeItem: (name) => {
    try {
      (remembers() ? localStorage : sessionStorage).removeItem(name);
    } catch {
      /* same as above */
    }
  },
};

/** The persist storage shared by the three session stores. */
export function rememberStorage<S>() {
  return createJSONStorage<S>(() => pickedStorage);
}

function removeCopies(storage: Storage): void {
  for (const key of Object.values(SESSION_STORE_KEYS)) storage.removeItem(key);
}

/**
 * Choose where the session persists. Call it before a sign-in writes the
 * stores; it drops the other storage's copies so no stale session survives
 * there.
 */
export function setRemember(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
    removeCopies(remember ? sessionStorage : localStorage);
  } catch {
    /* storage blocked: the stores fall back to memory */
  }
}

/**
 * Another tab moved the session to localStorage: this tab's private copy is
 * superseded, and must not come back if the flag flips again.
 */
export function dropTabCopies(): void {
  try {
    removeCopies(sessionStorage);
  } catch {
    /* nothing to drop */
  }
}
