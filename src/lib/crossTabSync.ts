import { queryClient } from '@/lib/queryClient';
import { useAccueilStore } from '@/stores/accueilStore';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { dropTabCopies, REMEMBER_KEY, SESSION_STORE_KEYS } from '@/stores/rememberStorage';
import { bumpSessionEpoch } from '@/stores/sessionEpoch';

/**
 * Re-read the session another tab wrote. Rehydrating does not write back, so
 * the tabs do not echo each other.
 */
async function syncAuth(): Promise<void> {
  const before = useAuthStore.getState();
  await useAuthStore.persist.rehydrate();
  const after = useAuthStore.getState();
  if (after.token === before.token) return;

  // Signed out, or another account: nothing this tab cached or has in flight is
  // theirs. A switch only needs the other side's data refetched. A bare token
  // refresh keeps the session as it is.
  const ended = !after.token || after.user?.id !== before.user?.id;
  const switched = after.user?.role !== before.user?.role;
  if (ended || switched) bumpSessionEpoch();
  if (ended) queryClient.clear();
  else if (switched) void queryClient.invalidateQueries();

  // Another account took this one's place: the mounted pages still hold the old
  // account's data and forms, and would send its actions under the new token.
  // A fresh load of the new session's home drops them all.
  if (before.token && after.token && after.user?.id !== before.user?.id) {
    window.location.assign(after.user?.role === 'prestataire' ? '/prestataire' : '/client');
  }
}

/**
 * Keep every tab on the same session: without it, a logout in one tab is undone
 * when another re-persists its tokens, and a switch leaves the others on the
 * old side. Call once at startup.
 */
export function initCrossTabSync(): void {
  window.addEventListener('storage', (event) => {
    const { key } = event;
    // null: the other tab cleared the whole storage. The flag moves the session
    // between localStorage and this tab's sessionStorage.
    const all = key === null || key === REMEMBER_KEY;
    if (all && event.newValue !== '0') dropTabCopies();
    if (all || key === SESSION_STORE_KEYS.auth) void syncAuth();
    if (all || key === SESSION_STORE_KEYS.accueil) void useAccueilStore.persist.rehydrate();
    if (all || key === SESSION_STORE_KEYS.onboarding) void useOnboardingStore.persist.rehydrate();
  });
}
