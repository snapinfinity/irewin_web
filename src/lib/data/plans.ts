import type { Plan, PlanId } from "@/lib/types";

/**
 * Premium plans. Prices are PLACEHOLDERS for testing — confirm final pricing
 * before the payment integration goes live.
 */
export const PLANS: Plan[] = [
  { id: "1m", name: "1 Month", months: 1, price: 9.99 },
  { id: "3m", name: "3 Months", months: 3, price: 24.99, badge: "Most popular" },
  { id: "6m", name: "6 Months", months: 6, price: 44.99 },
  { id: "12m", name: "1 Year", months: 12, price: 79.99, badge: "Best value" },
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

export function monthlyPrice(plan: Plan): number {
  return plan.price / plan.months;
}

/** Percentage saved vs paying the 1-month price every month. */
export function savingsPercent(plan: Plan): number {
  const base = PLANS[0].price;
  return Math.round((1 - monthlyPrice(plan) / base) * 100);
}

export const PLAN_IDS: PlanId[] = PLANS.map((p) => p.id);
