/**
 * Which session is current. Bumped when the session is replaced — a sign-in, a
 * switch, a logout, or one of those in another tab — but not by a token
 * refresh, which keeps the same session. An answer started under an older
 * epoch describes a session that is gone and must not be stored.
 */
let epoch = 0;

export function sessionEpoch(): number {
  return epoch;
}

export function bumpSessionEpoch(): void {
  epoch += 1;
}
