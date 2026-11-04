import { cache } from "react";
import { collection, doc, getDoc, getDocs, query, where, type DocumentData } from "firebase/firestore/lite";
import { getDb, toIso } from "@/lib/firebase";
import { FREE_JOB_PREVIEW_COUNT } from "@/lib/constants";
import { getCategories } from "@/lib/data/categories";
import type { Job } from "@/lib/types";

/** Firestore job document (written by the admin dashboard) → plain object safe for client components. */
export function mapJob(id: string, d: DocumentData): Job {
  return {
    id,
    title: d.title ?? "",
    companyId: d.companyId ?? "",
    companyName: d.companyName ?? "",
    companyLogoURL: d.companyLogoURL ?? null,
    category: d.category ?? "",
    categoryName: d.categoryName ?? "",
    subcategory: d.subcategory ?? null,
    subcategoryName: d.subcategoryName ?? null,
    location: d.location ?? "",
    workMode: d.workMode ?? "onsite",
    employmentType: d.employmentType ?? "full-time",
    experienceLevel: d.experienceLevel ?? "mid",
    salaryMin: typeof d.salaryMin === "number" ? d.salaryMin : null,
    salaryMax: typeof d.salaryMax === "number" ? d.salaryMax : null,
    currency: d.currency || "EUR",
    skills: Array.isArray(d.skills) ? d.skills : [],
    description: d.description ?? "",
    responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities : [],
    requirements: Array.isArray(d.requirements) ? d.requirements : [],
    benefits: Array.isArray(d.benefits) ? d.benefits : [],
    applicationUrl: d.applicationUrl ?? "",
    applicationDeadline: toIso(d.applicationDeadline),
    createdAt: toIso(d.createdAt) ?? new Date(0).toISOString(),
    openAccess: false,
  };
}

/** Slugs of categories switched to free in the dashboard (every job in them is open to everyone). */
async function freeCategorySlugs(): Promise<Set<string>> {
  return new Set((await getCategories()).filter((c) => !c.premium).map((c) => c.slug));
}

/** All published, non-deleted jobs, newest first. */
export const getPublishedJobs = cache(async (): Promise<Job[]> => {
  try {
    // Both equality filters are required by the Firestore rules for public reads.
    // Sorting happens here, so no extra composite index is needed.
    const [snap, free] = await Promise.all([
      getDocs(query(collection(getDb(), "jobs"), where("status", "==", "published"), where("isDeleted", "==", false))),
      freeCategorySlugs(),
    ]);
    return snap.docs
      .map((d) => ({ ...mapJob(d.id, d.data()), openAccess: free.has(String(d.data().category ?? "")) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.error("[IREWIN] Failed to load jobs from Firestore:", err);
    return [];
  }
});

/** One published job, or null if it doesn't exist / isn't public. */
export const getPublishedJob = cache(async (id: string): Promise<Job | null> => {
  try {
    const snap = await getDoc(doc(getDb(), "jobs", id));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.status !== "published" || data.isDeleted) return null;
    const free = await freeCategorySlugs();
    return { ...mapJob(snap.id, data), openAccess: free.has(String(data.category ?? "")) };
  } catch {
    // Rules deny reads of unpublished jobs → treat as not found.
    return null;
  }
});

/**
 * Jobs visitors without Premium can see: every job in a free category, plus the
 * newest few in each Premium category as a preview. `jobs` must be newest first.
 */
export function getFreeJobIds(jobs: Job[]): string[] {
  const perCategory = new Map<string, number>();
  const ids: string[] = [];
  for (const j of jobs) {
    if (j.openAccess) {
      ids.push(j.id);
      continue;
    }
    const seen = perCategory.get(j.category) ?? 0;
    if (seen < FREE_JOB_PREVIEW_COUNT) {
      ids.push(j.id);
      perCategory.set(j.category, seen + 1);
    }
  }
  return ids;
}

/** "Dublin 2" → "Dublin", "Killarney, Co. Kerry" → "Killarney". */
export function primaryLocation(location: string): string {
  const first = location.split(",")[0].trim();
  return first.replace(/\s+\d+[A-Za-z]?$/, "").trim() || location;
}

/** Irish counties, plus large towns often written without their county. */
const IRISH_PLACES = [
  "Ireland", "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny",
  "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo",
  "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow", "Antrim", "Armagh", "Fermanagh", "Derry", "Tyrone",
  "Belfast", "Athlone", "Drogheda", "Dundalk", "Swords", "Navan", "Ennis", "Tralee", "Killarney", "Bray", "Naas",
  "Letterkenny", "Shannon", "Newbridge", "Mullingar", "Portlaoise", "Castlebar", "Westport", "Remote",
];
const IRISH_PLACE_RE = new RegExp(`\\b(${IRISH_PLACES.join("|")})\\b`, "i");

/** True when a job's location is in Ireland (or remote), so test or stray locations stay out of the lists. */
export function isIrishLocation(location: string): boolean {
  return IRISH_PLACE_RE.test(location);
}

/** Distinct primary locations in Ireland, busiest first. */
export function getLocations(jobs: Job[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    if (!isIrishLocation(j.location)) continue;
    const loc = primaryLocation(j.location);
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function countByCategory(jobs: Job[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of jobs) out[j.category] = (out[j.category] ?? 0) + 1;
  return out;
}
