/**
 * Public-site types. They mirror the admin dashboard's Firestore models
 * (irewin_dashboard/src/types) so the static data in src/lib/data can later be
 * swapped for Firestore reads without touching the UI. Timestamps are ISO
 * strings here instead of Firestore Timestamps.
 */

export type WorkMode = "remote" | "hybrid" | "onsite";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export interface Subcategory {
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Company {
  id: string;
  name: string;
  logoURL: string | null;
  website: string | null;
  industry: string;
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogoURL: string | null;
  category: string;
  categoryName: string;
  subcategory: string | null;
  subcategoryName: string | null;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  applicationUrl: string;
  applicationDeadline: string | null;
  createdAt: string;
}

export type PlanId = "1m" | "3m" | "6m" | "12m";

export interface Plan {
  id: PlanId;
  name: string;
  months: number;
  price: number;
  badge?: string;
}

export interface Membership {
  planId: PlanId;
  startedAt: string;
  expiresAt: string;
}

export interface SessionUser {
  name: string;
  email: string;
}
