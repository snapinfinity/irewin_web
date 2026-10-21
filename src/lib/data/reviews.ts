import { cache } from "react";
import { collection, getDocs, query, where } from "firebase/firestore/lite";
import { getDb, toIso } from "@/lib/firebase";
import type { Review } from "@/lib/types";

/** Approved customer reviews, newest first. Pending/rejected ones are never readable here (Firestore rules). */
export const getApprovedReviews = cache(async (): Promise<Review[]> => {
  try {
    // Sorted here rather than with orderBy, so no composite index is needed.
    const snap = await getDocs(query(collection(getDb(), "reviews"), where("status", "==", "approved")));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: String(data.name ?? ""),
          photoURL: data.photoURL ?? null,
          rating: Number(data.rating ?? 0),
          text: String(data.text ?? ""),
          status: "approved" as const,
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
        };
      })
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  } catch (err) {
    console.error("[IREWIN] Failed to load reviews from Firestore:", err);
    return [];
  }
});

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
