import { cache } from "react";
import { collection, getDocs, query, where } from "firebase/firestore/lite";
import { getDb } from "@/lib/firebase";
import type { Company } from "@/lib/types";

/** Non-deleted companies from the dashboard (not used on a page yet; handy for a future Companies page). */
export const getCompanies = cache(async (): Promise<Company[]> => {
  try {
    const snap = await getDocs(query(collection(getDb(), "companies"), where("isDeleted", "==", false)));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? ""),
          logoURL: data.logoURL ?? null,
          website: data.website ?? null,
          industry: "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("[IREWIN] Failed to load companies from Firestore:", err);
    return [];
  }
});
