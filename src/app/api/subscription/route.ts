import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/firebase-admin";
import { dodo, ownedSubscription, syncSubscription } from "@/lib/server/dodo";

/**
 * POST { action } as the signed-in member, for their own Premium subscription:
 * - "cancel"  → stop auto-renew; Premium stays until the end of the paid period
 * - "resume"  → turn auto-renew back on (only before the period ends)
 * - "portal"  → returns { url } for Dodo's customer portal (change card, invoices)
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  if (action !== "cancel" && action !== "resume" && action !== "portal") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    const sub = await ownedSubscription(user.uid);
    if (!sub) return NextResponse.json({ error: "No Premium subscription found on your account." }, { status: 404 });

    if (action === "portal") {
      const origin = process.env.SITE_URL ?? new URL(request.url).origin;
      const portal = await dodo().customers.customerPortal.create(sub.customer.customer_id, { return_url: `${origin}/account` });
      return NextResponse.json({ url: portal.link });
    }

    if (sub.status !== "active") {
      return NextResponse.json({ error: "This subscription can't be changed any more. Choose a plan again from Premium." }, { status: 409 });
    }
    await dodo().subscriptions.update(sub.subscription_id, { cancel_at_next_billing_date: action === "cancel" });
    return NextResponse.json(await syncSubscription(sub.subscription_id, { hintUid: user.uid }));
  } catch (err) {
    console.error(`[IREWIN] Subscription ${action} failed:`, err);
    return NextResponse.json({ error: "Couldn't update your subscription. Please try again." }, { status: 502 });
  }
}
