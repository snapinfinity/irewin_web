import type { Plan, PlanId } from "@/lib/types";
import { addHours, addMonths, addWeeks, formatMoney } from "@/lib/format";

/**
 * Premium plans. Recurring ones are auto-renewing subscriptions (charged `price`
 * every `count` × `period` until cancelled). The 1-hour pass is a one-off payment:
 * Dodo can't renew more often than daily, so it simply ends after the hour.
 * Keep `recurring` right after `price` — scripts/setup-dodo-products.mjs reads it.
 */
export const PLANS: Plan[] = [
  { id: "1h", name: "1 Hour", period: "hour", count: 1, price: 0.99, recurring: false, badge: "Try it" },
  { id: "1w", name: "Weekly", period: "week", count: 1, price: 1.99, recurring: true },
  { id: "3m", name: "3 Months", period: "month", count: 3, price: 19.99, recurring: true, badge: "Most popular" },
];

const WEEKLY = PLANS.find((p) => p.id === "1w")!;

export const PREMIUM_BENEFITS = [
  "See every job listed across Ireland",
  "Apply directly on employers' websites",
  "Full salary, requirements and benefits for every role",
  "Jobs from every job board, plus roles posted only on company websites",
  "Every listing reviewed by our team before it goes live",
  "New jobs the day they're published",
  "Filter by category, location, work mode and experience",
  `Just ${formatMoney(WEEKLY.price, "EUR", 2)} a week, about the price of a single bus fare`,
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** "1 week", "3 months". */
export function planLength(plan: Plan): string {
  return `${plan.count} ${plan.period}${plan.count === 1 ? "" : "s"}`;
}

/** "every week", "every 3 months". */
export function billingInterval(plan: Plan): string {
  return plan.count === 1 ? `every ${plan.period}` : `every ${plan.count} ${plan.period}s`;
}

/** When access bought at `from` runs out (= the next renewal date). */
export function planExpiry(from: Date, plan: Plan): Date {
  if (plan.period === "hour") return addHours(from, plan.count);
  return plan.period === "week" ? addWeeks(from, plan.count) : addMonths(from, plan.count);
}

export function weeklyPrice(plan: Plan): number {
  const weeks = plan.period === "hour" ? plan.count / 168 : plan.period === "week" ? plan.count : (plan.count * 52) / 12;
  return plan.price / weeks;
}

/** Percentage saved vs paying the weekly price every week (0 for the hourly pass). */
export function savingsPercent(plan: Plan): number {
  if (!plan.recurring) return 0;
  const base = WEEKLY.price;
  return Math.round((1 - weeklyPrice(plan) / base) * 100);
}

export const PLAN_IDS: PlanId[] = PLANS.map((p) => p.id);
