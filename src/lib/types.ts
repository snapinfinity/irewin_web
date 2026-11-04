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
  /** Set in the dashboard. true = Premium only (a few free previews); false = every job free for everyone. */
  premium: boolean;
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
  /** In a free (non-Premium) category: anyone can see it and apply. */
  openAccess: boolean;
}

export type PlanId = "1h" | "1d" | "1w" | "3m";

export interface Plan {
  id: PlanId;
  name: string;
  /** Each payment grants `count` × `period` of access. */
  period: "hour" | "day" | "week" | "month";
  count: number;
  price: number;
  /** true = auto-renewing Dodo subscription; false = one-off pass that just ends. */
  recurring: boolean;
  badge?: string;
}

export interface Membership {
  planId: PlanId;
  /** "on_hold" = a renewal payment failed and Dodo stopped retrying; Premium is paused until the card is updated. */
  status: "active" | "cancelled" | "on_hold";
  startedAt: string;
  expiresAt: string;
  /** "dodo_test" / "dodo" when paid through Dodo Payments; "test" for older manually activated memberships. */
  source: string;
  /** Dodo payment id that granted/extended this membership (one-off plans only). */
  paymentId: string | null;
  /** Dodo subscription behind this membership; null for older one-off plans. */
  subscriptionId: string | null;
  /** Dodo's subscription status (active, past_due, on_hold, cancelled, expired…). */
  subscriptionStatus: string | null;
  /** true while the plan will charge again and renew on nextBillingDate. */
  autoRenew: boolean;
  nextBillingDate: string | null;
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
