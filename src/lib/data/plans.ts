import type { Plan, PlanId } from "@/lib/types";
import { addMonths, addWeeks } from "@/lib/format";

/** Premium plans. Each is a one-off payment for a fixed length of access. */
export const PLANS: Plan[] = [
  { id: "1w", name: "Weekly", period: "week", count: 1, price: 1.99 },
  { id: "3m", name: "3 Months", period: "month", count: 3, price: 19.99, badge: "Most popular" },
];

export const PREMIUM_BENEFITS = [
  "See every job listed across Ireland",
  "Apply directly on employers' websites",
  "Full salary, requirements and benefits for every role",
  "New jobs the day they're published",
  "Filter by category, location, work mode and experience",
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** "1 week", "3 months". */
export function planLength(plan: Plan): string {
  return `${plan.count} ${plan.period}${plan.count === 1 ? "" : "s"}`;
}

/** When access bought at `from` runs out. */
export function planExpiry(from: Date, plan: Plan): Date {
  return plan.period === "week" ? addWeeks(from, plan.count) : addMonths(from, plan.count);
}

export function weeklyPrice(plan: Plan): number {
  const weeks = plan.period === "week" ? plan.count : (plan.count * 52) / 12;
  return plan.price / weeks;
}

/** Percentage saved vs paying the weekly price every week. */
export function savingsPercent(plan: Plan): number {
  const base = PLANS[0].price;
  return Math.round((1 - weeklyPrice(plan) / base) * 100);
}

export const PLAN_IDS: PlanId[] = PLANS.map((p) => p.id);
