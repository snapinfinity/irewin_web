import { cache } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore/lite";
import { getDb, toIso } from "@/lib/firebase";
import { SAMPLE_REVIEWS } from "@/lib/data/sample-reviews";
import type { Review } from "@/lib/types";

/**
 * The newest `max` approved customer reviews. Only that many documents are
 * read (status + updatedAt index in irewin_dashboard/firestore.indexes.json),
 * and pages cache the result for a minute, so cost doesn't grow with visitors
 * or with the total number of reviews. Pending/rejected reviews are never
 * readable here (Firestore rules). In local development, labelled sample
 * reviews fill the list to preview the design.
 */
export const getLatestReviews = cache(async (max: number): Promise<Review[]> => {
  const real = await loadLatestReviews(max);
  return process.env.NODE_ENV === "development" ? [...real, ...SAMPLE_REVIEWS].slice(0, max) : real;
});

async function loadLatestReviews(max: number): Promise<Review[]> {
  try {
    const snap = await getDocs(
      query(collection(getDb(), "reviews"), where("status", "==", "approved"), orderBy("updatedAt", "desc"), limit(max)),
    );
    return snap.docs.map((d) => {
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
    });
  } catch (err) {
    console.error("[IREWIN] Failed to load reviews from Firestore:", err);
    return [];
  }
}
