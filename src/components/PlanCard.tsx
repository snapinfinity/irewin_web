import Link from "next/link";
import { clsx } from "clsx";
import { CircleCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { billingInterval, planLength, savingsPercent, weeklyPrice } from "@/lib/data/plans";
import type { Plan } from "@/lib/types";

/**
 * `current` = already Premium on an older one-off plan (the new plan starts when it ends).
 * `subscribed` = already on an auto-renewing plan, so the card links to My account instead.
 * `activePlan` = this card is the plan they're subscribed to.
 */
export function PlanCard({
  plan,
  current = false,
  subscribed = false,
  activePlan = false,
  loggedIn = true,
}: {
  plan: Plan;
  current?: boolean;
  subscribed?: boolean;
  activePlan?: boolean;
  loggedIn?: boolean;
}) {
  const featured = plan.badge === "Most popular";
  const saving = savingsPercent(plan);
  const checkout = `/checkout?plan=${plan.id}`;
  // Not signed in yet → log in first, then land on checkout with this plan.
  const passBlocked = !plan.recurring && (current || subscribed); // already Premium: an extra hour makes no sense
  const href = subscribed || passBlocked ? "/account" : loggedIn ? checkout : `/login?next=${encodeURIComponent(checkout)}`;
  const cta = passBlocked
    ? "You already have Premium"
    : subscribed
    ? activePlan
      ? "Your current plan"
      : "Manage plan in My account"
    : !plan.recurring
      ? current
        ? `Add ${planLength(plan)}`
        : `Try ${plan.name}`
      : current
        ? `Switch to ${plan.name}`
        : `Choose ${plan.name}`;
  const blurb = !plan.recurring ? "Try Premium right now" : saving > 0 ? `Save ${saving}% vs weekly` : "Flexible, short term";
  const priceNote = !plan.recurring
    ? `one-off for ${planLength(plan)}`
    : plan.period === "week" && plan.count === 1
      ? "billed every week"
      : `${formatMoney(weeklyPrice(plan), "EUR", 2)} / week, billed ${billingInterval(plan)}`;
  const lastFeature = plan.recurring ? `Renews ${billingInterval(plan)} · cancel any time` : `${planLength(plan)} access · no renewal`;
  return (
    <div
      className={clsx(
        "relative flex flex-col gap-5 rounded-3xl border bg-white p-6 sm:p-7",
        featured ? "border-2 border-brand-600 shadow-card" : "border-line",
      )}
    >
      {plan.badge && (
        <span
          className={clsx(
            "absolute -top-3.5 left-6 rounded-full px-3 py-1 text-xs font-bold",
            featured ? "bg-brand-600 text-white" : "bg-gold text-dark",
          )}
        >
          {plan.badge}
        </span>
      )}
      <div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted">{blurb}</p>
      </div>
      <div>
        <p className="font-display text-4xl font-extrabold tracking-tight text-ink">{formatMoney(plan.price, "EUR", 2)}</p>
        <p className="mt-1 text-sm text-muted">{priceNote}</p>
      </div>
      <ul className="flex flex-col gap-2.5 text-[15px] text-ink-2">
        {["All jobs unlocked", "Apply to any job", "Full salary details", lastFeature].map(
          (f) => (
            <li key={f} className="flex items-center gap-2.5">
              <CircleCheck className="h-5 w-5 shrink-0 text-brand-600" /> {f}
            </li>
          ),
        )}
      </ul>
      <Link
        href={href}
        className={clsx(
          "mt-auto flex h-12 items-center justify-center rounded-xl font-display font-semibold",
          featured ? "bg-brand-600 text-white hover:bg-brand-700" : "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
