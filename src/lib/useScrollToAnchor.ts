import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Bring a block into view once the screen has drawn it — what a link's query
 * asks for (`?section=devis`, `?occurrence=…`, `?facture=…`, from an alert).
 * The first of `ids` found on the page wins. Once per page and target: a later
 * refetch, or the screen pinning its own query, never moves the user back.
 */
export function useScrollToAnchor(ids: (string | null | undefined)[], ready: boolean): void {
  const { pathname } = useLocation();
  const target = ids.filter(Boolean).join('|');
  const done = useRef<string | null>(null);
  useEffect(() => {
    const key = `${pathname}#${target}`;
    if (!target || !ready || done.current === key) return;
    for (const id of target.split('|')) {
      const el = document.getElementById(id);
      if (!el) continue;
      done.current = key;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }, [pathname, target, ready]);
}
