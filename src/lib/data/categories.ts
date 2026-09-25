import { cache } from "react";
import { collection, getDocs, query, where } from "firebase/firestore/lite";
import { getDb } from "@/lib/firebase";
import type { Category, Subcategory } from "@/lib/types";

/** Picks an icon from the category's slug/name (the dashboard doesn't store icons). */
export function iconForCategory(slug: string, name: string): string {
  const s = `${slug} ${name}`.toLowerCase();
  const rules: [RegExp, string][] = [
    [/tech|software|it\b|developer|data/, "laptop"],
    [/health|nurs|medic|care/, "heart-pulse"],
    [/financ|account|bank|insur/, "landmark"],
    [/pharma|life.?science|lab|biotech/, "flask"],
    [/engineer|manufactur|mechanic/, "wrench"],
    [/sales|marketing|media/, "megaphone"],
    [/hospitality|touris|hotel|chef|food/, "utensils"],
    [/construct|trade|build/, "hard-hat"],
    [/educat|teach|train/, "graduation-cap"],
    [/logistic|supply|transport|driver|warehouse/, "truck"],
    [/retail|shop|store/, "shopping-bag"],
    [/customer|support|service|call/, "headset"],
  ];
  return rules.find(([re]) => re.test(s))?.[1] ?? "briefcase";
}

/** Enabled, non-deleted categories from the dashboard, A–Z. */
export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    // The `isDeleted == false` filter is required by the Firestore rules for public reads.
    const snap = await getDocs(query(collection(getDb(), "categories"), where("isDeleted", "==", false)));
    return snap.docs
      .map((d) => {
        const data = d.data();
        const subcategories = ((data.subcategories ?? []) as (Subcategory & { isDeleted?: boolean })[])
          .filter((s) => !s.isDeleted)
          .map((s) => ({ name: s.name, slug: s.slug }));
        return {
          id: d.id,
          name: String(data.name ?? d.id),
          slug: String(data.slug ?? d.id),
          icon: iconForCategory(String(data.slug ?? d.id), String(data.name ?? "")),
          subcategories,
          enabled: data.enabled !== false,
        };
      })
      .filter((c) => c.enabled)
      .map((c): Category => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, subcategories: c.subcategories }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("[IREWIN] Failed to load categories from Firestore:", err);
    return [];
  }
});

export function findCategory(categories: Category[], slug: string | null | undefined) {
  return categories.find((c) => c.slug === slug);
}
