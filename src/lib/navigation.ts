/**
 * Navigation for code that runs outside the router's tree — a toast, a live
 * event from the alerts hub. main.tsx plugs the router in; until then, a full
 * page load.
 */
let navigateFn: ((to: string) => void) | null = null;

export function setAppNavigate(fn: (to: string) => void): void {
  navigateFn = fn;
}

export function appNavigate(to: string): void {
  if (navigateFn) navigateFn(to);
  else window.location.assign(to);
}
