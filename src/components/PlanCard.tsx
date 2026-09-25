import Link from "next/link";
import { clsx } from "clsx";
import { CircleCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { monthlyPrice, savingsPercent } from "@/lib/data/plans";
import type { Plan } from "@/lib/types";

export function PlanCard({ plan, current = false }: { plan: Plan; current?: boolean }) {
  const featured = plan.badge === "Most popular";
  const saving = savingsPercent(plan);
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
        <p className="mt-1 text-sm text-muted">{saving > 0 ? `Save ${saving}% vs monthly` : "Flexible, short term"}</p>
      </div>
      <div>
        <p className="font-display text-4xl font-extrabold tracking-tight text-ink">{formatMoney(plan.price, "EUR", 2)}</p>
        <p className="mt-1 text-sm text-muted">
          {plan.months === 1 ? "one-off for 1 month" : `${formatMoney(monthlyPrice(plan), "EUR", 2)} / month, paid once`}
        </p>
      </div>
      <ul className="flex flex-col gap-2.5 text-[15px] text-ink-2">
        {["All jobs unlocked", "Apply to any job", "Full salary details", `${plan.months === 12 ? "12" : plan.months} month${plan.months === 1 ? "" : "s"} access`].map(
          (f) => (
            <li key={f} className="flex items-center gap-2.5">
              <CircleCheck className="h-5 w-5 shrink-0 text-brand-600" /> {f}
            </li>
          ),
        )}
      </ul>
      <Link
        href={`/checkout?plan=${plan.id}`}
        className={clsx(
          "mt-auto flex h-12 items-center justify-center rounded-xl font-display font-semibold",
          featured ? "bg-brand-600 text-white hover:bg-brand-700" : "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
        )}
      >
        {current ? "Extend with this plan" : `Choose ${plan.name}`}
      </Link>
    </div>
  );
}
