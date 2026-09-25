"use client";

import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getClientAuth, getClientDb, googleProvider } from "@/lib/firebase-client";
import { getPlan } from "@/lib/data/plans";
import { addMonths } from "@/lib/format";
import type { Membership, PlanId, SessionUser, UserProfile } from "@/lib/types";

/**
 * Session = Firebase Auth (Google sign-in only) + the user's document in the
 * `users` collection, kept live with onSnapshot. Components read it through
 * `useSession()`.
 */

export interface SessionState {
  user: SessionUser | null;
  profile: UserProfile | null;
  membership: Membership | null;
}

const USERS = "users";
let state: SessionState | null = null; // null until Firebase has reported the auth state
let started = false;
let unsubProfile: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

const iso = (v: unknown): string | null =>
  v instanceof Timestamp ? v.toDate().toISOString() : typeof v === "string" ? v : null;

function toMembership(m: DocumentData | null | undefined): Membership | null {
  if (!m || !m.planId || !m.expiresAt) return null;
  return {
    planId: m.planId,
    status: m.status ?? "active",
    startedAt: iso(m.startedAt) ?? "",
    expiresAt: iso(m.expiresAt) ?? "",
    source: m.source ?? "test",
  };
}

function toProfile(uid: string, d: DocumentData): UserProfile {
  return {
    uid,
    email: d.email ?? "",
    emailVerified: !!d.emailVerified,
    displayName: d.displayName ?? "",
    firstName: d.firstName ?? "",
    lastName: d.lastName ?? "",
    photoURL: d.photoURL ?? null,
    phoneNumber: d.phoneNumber ?? null,
    provider: d.provider ?? "google.com",
    locale: d.locale ?? null,
    timeZone: d.timeZone ?? null,
    marketingOptIn: !!d.marketingOptIn,
    marketingOptInAt: iso(d.marketingOptInAt),
    membership: toMembership(d.membership),
    createdAt: iso(d.createdAt),
    lastLoginAt: iso(d.lastLoginAt),
    loginCount: typeof d.loginCount === "number" ? d.loginCount : 0,
    signupSource: d.signupSource ?? "irewin_web",
  };
}

function sessionUser(u: User): SessionUser {
  return { uid: u.uid, name: u.displayName || u.email?.split("@")[0] || "Member", email: u.email ?? "", photoURL: u.photoURL };
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  onAuthStateChanged(getClientAuth(), (fbUser) => {
    unsubProfile?.();
    unsubProfile = null;
    if (!fbUser) {
      emit({ user: null, profile: null, membership: null });
      return;
    }
    const user = sessionUser(fbUser);
    // Until the users/{uid} doc loads, show the user as signed in without Premium.
    emit({ user, profile: null, membership: null });
    unsubProfile = onSnapshot(
      doc(getClientDb(), USERS, fbUser.uid),
      (snap) => {
        const profile = snap.exists() ? toProfile(snap.id, snap.data()) : null;
        emit({ user, profile, membership: profile?.membership ?? null });
      },
      (err) => console.error("[IREWIN] Could not read users/{uid} — are the Firestore rules deployed?", err),
    );
  });
}

export function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;
export const getServerSnapshot = (): SessionState | null => null;

export type SignInResult = { ok: true; isNewUser: boolean } | { ok: false; error: string };

/**
 * Google sign-in. Creates the user's document on first sign-in (full details),
 * or — if this email already has an account — keeps its saved details and only
 * refreshes the login info.
 */
export async function signInWithGoogle(opts: { marketingOptIn: boolean }): Promise<SignInResult> {
  try {
    const { user } = await signInWithPopup(getClientAuth(), googleProvider());
    const ref = doc(getClientDb(), USERS, user.uid);
    const existing = await getDoc(ref);
    const [firstName = "", ...rest] = (user.displayName ?? "").trim().split(/\s+/);
    const now = serverTimestamp();

    if (existing.exists()) {
      const changes: Record<string, unknown> = {
        displayName: user.displayName ?? existing.get("displayName") ?? "",
        photoURL: user.photoURL ?? null,
        emailVerified: user.emailVerified,
        lastLoginAt: now,
        loginCount: increment(1),
      };
      // Ticking the box again opts back in; leaving it unticked never removes an existing opt-in.
      if (opts.marketingOptIn && !existing.get("marketingOptIn")) {
        changes.marketingOptIn = true;
        changes.marketingOptInAt = now;
      }
      await updateDoc(ref, changes);
      return { ok: true, isNewUser: false };
    }

    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? "",
      emailVerified: user.emailVerified,
      displayName: user.displayName ?? "",
      firstName,
      lastName: rest.join(" "),
      photoURL: user.photoURL ?? null,
      phoneNumber: user.phoneNumber ?? null,
      provider: user.providerData[0]?.providerId ?? "google.com",
      locale: typeof navigator !== "undefined" ? navigator.language : null,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      marketingOptIn: opts.marketingOptIn,
      marketingOptInAt: opts.marketingOptIn ? now : null,
      membership: null,
      signupSource: "irewin_web",
      createdAt: now,
      lastLoginAt: now,
      loginCount: 1,
    });
    return { ok: true, isNewUser: true };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { ok: false, error: "Sign-in was cancelled." };
    }
    if (code === "auth/unauthorized-domain") {
      return { ok: false, error: "This website's domain isn't allowed in Firebase yet (Authentication → Settings → Authorized domains)." };
    }
    if (code === "auth/popup-blocked") {
      return { ok: false, error: "Your browser blocked the Google window. Allow pop-ups for this site and try again." };
    }
    if (code === "permission-denied") {
      return { ok: false, error: "Signed in, but your profile couldn't be saved (Firestore rules not deployed yet)." };
    }
    console.error("[IREWIN] Google sign-in failed:", err);
    return { ok: false, error: "Google sign-in failed. Please try again." };
  }
}

export async function signOut() {
  await fbSignOut(getClientAuth());
}

export async function setMarketingOptIn(value: boolean) {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(getClientDb(), USERS, uid), { marketingOptIn: value, marketingOptInAt: value ? serverTimestamp() : null });
}

/**
 * TEST MODE: activates Premium straight from the browser. When payments are
 * added, this must move to the server (payment webhook + Admin SDK) and the
 * Firestore rules must stop users writing their own `membership`.
 */
export async function activateMembership(planId: PlanId) {
  const plan = getPlan(planId);
  const uid = getClientAuth().currentUser?.uid;
  if (!plan || !uid) return;
  const current = state?.membership ?? null;
  const now = new Date();
  // Buying again while active extends from the current expiry date.
  const from = isMembershipActive(current) ? new Date(current!.expiresAt) : now;
  await updateDoc(doc(getClientDb(), USERS, uid), {
    membership: {
      planId,
      status: "active",
      startedAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(addMonths(from, plan.months)),
      source: "test",
    },
  });
}

export async function cancelMembership() {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(getClientDb(), USERS, uid), { membership: null });
}

export function isMembershipActive(m: Membership | null): boolean {
  return !!m && m.status !== "cancelled" && new Date(m.expiresAt).getTime() > Date.now();
}
