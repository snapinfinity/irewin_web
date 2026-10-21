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

export type PlanId = "1w" | "3m";

export interface Plan {
  id: PlanId;
  name: string;
  /** One purchase grants `count` × `period` of access. */
  period: "week" | "month";
  count: number;
  price: number;
  badge?: string;
}

export interface Membership {
  planId: PlanId;
  status: "active" | "cancelled";
  startedAt: string;
  expiresAt: string;
  /** "dodo_test" / "dodo" when paid through Dodo Payments; "test" for older manually activated memberships. */
  source: string;
  /** Dodo payment id that granted/extended this membership. */
  paymentId: string | null;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

/** A customer review in the `reviews` collection (doc id = author's uid). Only approved ones are public. */
export interface Review {
  uid: string;
  name: string;
  photoURL: string | null;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: string | null;
  updatedAt: string | null;
  /** Local-development preview data (src/lib/data/sample-reviews.ts), never real. */
  sample?: boolean;
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
