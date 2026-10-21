"use client";

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase-client";
import type { Review } from "@/lib/types";

/**
 * The signed-in visitor's own review (reviews/{uid}). Every save is sent as
 * "pending" — it only appears on the site after staff approve it in the
 * admin dashboard. Firestore rules enforce all of this.
 */
const REVIEWS = "reviews";

export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 600;

const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

export async function getMyReview(): Promise<Review | null> {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(getClientDb(), REVIEWS, uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    name: d.name ?? "",
    photoURL: d.photoURL ?? null,
    rating: d.rating ?? 0,
    text: d.text ?? "",
    status: d.status ?? "pending",
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
  };
}

/** "Mary O'Brien" → "Mary O." — keeps reviews personal without publishing full surnames. */
export function publicName(displayName: string): string {
  const [first = "", ...rest] = displayName.trim().split(/\s+/);
  const last = rest.at(-1);
  return (last ? `${first} ${last.charAt(0).toUpperCase()}.` : first).slice(0, 60) || "IREWIN member";
}

export async function saveMyReview({ rating, text }: { rating: number; text: string }) {
  const user = getClientAuth().currentUser;
  if (!user) throw new Error("Please sign in again.");
  const ref = doc(getClientDb(), REVIEWS, user.uid);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    uid: user.uid,
    name: publicName(user.displayName ?? ""),
    photoURL: user.photoURL ?? null,
    rating,
    text: text.trim(),
    status: "pending",
    createdAt: existing.exists() ? existing.get("createdAt") : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMyReview() {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(getClientDb(), REVIEWS, uid));
}
