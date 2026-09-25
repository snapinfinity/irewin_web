import { cache } from "react";
import { collection, doc, getDoc, getDocs, query, where, type DocumentData } from "firebase/firestore/lite";
import { getDb, toIso } from "@/lib/firebase";
import { FREE_JOB_PREVIEW_COUNT } from "@/lib/constants";
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
  };
}

/** All published, non-deleted jobs, newest first. */
export const getPublishedJobs = cache(async (): Promise<Job[]> => {
  try {
    // Both equality filters are required by the Firestore rules for public reads.
    // Sorting happens here, so no extra composite index is needed.
    const snap = await getDocs(
      query(collection(getDb(), "jobs"), where("status", "==", "published"), where("isDeleted", "==", false)),
    );
    return snap.docs.map((d) => mapJob(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    return mapJob(snap.id, data);
  } catch {
    // Rules deny reads of unpublished jobs → treat as not found.
    return null;
  }
});

/** The newest jobs are the free preview for visitors without Premium. */
export function getFreeJobIds(jobs: Job[]): string[] {
  return jobs.slice(0, FREE_JOB_PREVIEW_COUNT).map((j) => j.id);
}

/** "Dublin 2" → "Dublin", "Killarney, Co. Kerry" → "Killarney". */
export function primaryLocation(location: string): string {
  const first = location.split(",")[0].trim();
  return first.replace(/\s+\d+[A-Za-z]?$/, "").trim() || location;
}

/** Distinct primary locations, busiest first. */
export function getLocations(jobs: Job[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
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

export function countBySubcategory(jobs: Job[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of jobs) if (j.subcategory) out[`${j.category}/${j.subcategory}`] = (out[`${j.category}/${j.subcategory}`] ?? 0) + 1;
  return out;
}
