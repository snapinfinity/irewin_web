import type { Membership, PlanId, SessionUser } from "@/lib/types";
import { getPlan } from "@/lib/data/plans";
import { addMonths } from "@/lib/format";

/**
 * TEST-ONLY session store. Login and Premium are simulated in localStorage so
 * the full flow can be tried before real auth (e.g. Firebase Auth) and payments
 * are connected. Replace `signIn`, `signOut` and `activateMembership` with real
 * calls later — the UI only talks to this module through `useSession`.
 */

export interface SessionState {
  user: SessionUser | null;
  membership: Membership | null;
}

const KEY = "irewin_test_session";
const EMPTY: SessionState = { user: null, membership: null };

let cachedRaw: string | null | undefined;
let cachedState: SessionState = EMPTY;
const listeners = new Set<() => void>();

function read(): SessionState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? { ...EMPTY, ...(JSON.parse(raw) as SessionState) } : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

function write(next: SessionState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — state still updates for this tab */
    cachedRaw = JSON.stringify(next);
    cachedState = next;
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = read;

/** On the server (and during hydration) we don't know the session yet. */
export const getServerSnapshot = (): SessionState | null => null;

export function signIn(user: SessionUser) {
  write({ ...read(), user });
}

export function signOut() {
  write(EMPTY);
}

export function activateMembership(planId: PlanId) {
  const plan = getPlan(planId);
  const state = read();
  if (!plan || !state.user) return;
  const now = new Date();
  // Buying again while active extends from the current expiry date.
  const from = isMembershipActive(state.membership) ? new Date(state.membership!.expiresAt) : now;
  write({
    ...state,
    membership: { planId, startedAt: now.toISOString(), expiresAt: addMonths(from, plan.months).toISOString() },
  });
}

export function cancelMembership() {
  write({ ...read(), membership: null });
}

export function isMembershipActive(m: Membership | null): boolean {
  return !!m && new Date(m.expiresAt).getTime() > Date.now();
}
