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
  status: "active" | "cancelled";
  startedAt: string;
  expiresAt: string;
  /** "test" until real payments are connected. */
  source: string;
}

export interface SessionUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

/** The signed-in user's document in the `users` Firestore collection (ISO dates). */
export interface UserProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  provider: string;
  locale: string | null;
  timeZone: string | null;
  marketingOptIn: boolean;
  marketingOptInAt: string | null;
  membership: Membership | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  signupSource: string;
}
