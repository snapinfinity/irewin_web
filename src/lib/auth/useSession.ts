"use client";

import { useSyncExternalStore } from "react";
import {
  activateMembership,
  cancelMembership,
  getServerSnapshot,
  getSnapshot,
  isMembershipActive,
  signIn,
  signOut,
  subscribe,
} from "@/lib/auth/session-store";

export function useSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = state !== null;
  const user = state?.user ?? null;
  const membership = state?.membership ?? null;
  return {
    /** false until the browser session has been read (avoids flashing locked/unlocked UI). */
    ready,
    user,
    membership,
    isLoggedIn: !!user,
    isPremium: !!user && isMembershipActive(membership),
    signIn,
    signOut,
    activateMembership,
    cancelMembership,
  };
}
