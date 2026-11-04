"use client";

import { useSyncExternalStore } from "react";
import {
  cancelMembership,
  confirmPayment,
  getServerSnapshot,
  getSnapshot,
  isMembershipActive,
  openBillingPortal,
  setAutoRenew,
  setMarketingOptIn,
  signInWithGoogle,
  signOut,
  startCheckout,
  subscribe,
} from "@/lib/auth/session-store";

export function useSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = state !== null;
  const user = state?.user ?? null;
  const membership = state?.membership ?? null;
  return {
    /** false until Firebase has reported whether someone is signed in (avoids flashing locked/unlocked UI). */
    ready,
    user,
    profile: state?.profile ?? null,
    membership,
    isLoggedIn: !!user,
    isPremium: !!user && isMembershipActive(membership),
    /** Premium on an auto-renewing plan (so buying another plan makes no sense). */
    isSubscribed: !!user && isMembershipActive(membership) && !!membership?.subscriptionId && membership.autoRenew,
    signInWithGoogle,
    signOut,
    setMarketingOptIn,
    startCheckout,
    confirmPayment,
    cancelMembership,
    setAutoRenew,
    openBillingPortal,
  };
}
