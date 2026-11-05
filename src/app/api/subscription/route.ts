import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/firebase-admin";
import { dodo, dodoEnvironment, ownedSubscription, syncAllSubscriptions, syncSubscription } from "@/lib/server/dodo";

/**
 * POST { action } as the signed-in member, for their own Premium subscription:
 * - "cancel"  → stop auto-renew; Premium stays until the end of the paid period
 * - "resume"  → turn auto-renew back on (only before the period ends)
 * - "portal"  → returns { url } for Dodo's customer portal (change card, invoices)
 *
 * Test mode only (refused in live mode):
 * - "test_renew_soon" → moves the next billing date to 2 minutes from now, so Dodo charges a renewal right away
 * - "refresh"         → re-reads the subscription from Dodo (stands in for webhooks, which can't reach localhost)
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  const testOnly = action === "test_renew_soon" || action === "refresh";
  if (action !== "cancel" && action !== "resume" && action !== "portal" && !testOnly) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (testOnly && dodoEnvironment !== "test_mode") {
    return NextResponse.json({ error: "Only available in test mode." }, { status: 403 });
  }

  try {
    const sub = await ownedSubscription(user.uid);
    if (!sub) return NextResponse.json({ error: "No Premium subscription found on your account." }, { status: 404 });

    if (action === "portal") {
      const origin = process.env.SITE_URL ?? new URL(request.url).origin;
      const portal = await dodo().customers.customerPortal.create(sub.customer.customer_id, { return_url: `${origin}/account` });
      return NextResponse.json({ url: portal.link });
    }

    if (action === "refresh") {
      await syncSubscription(sub.subscription_id, { hintUid: user.uid });
      const all = await syncAllSubscriptions(user.uid, sub.customer.customer_id);
      const current = await ownedSubscription(user.uid);
      return NextResponse.json({ activeSubscriptions: all.length, current: current ? { plan: current.product_id, ...summary(current) } : null });
    }

    if (sub.status !== "active") {
      return NextResponse.json({ error: "This subscription can't be changed any more. Choose a plan again from Premium." }, { status: 409 });
    }
    if (action === "test_renew_soon") {
      const at = new Date(Date.now() + 2 * 60_000).toISOString();
      await dodo().subscriptions.update(sub.subscription_id, { next_billing_date: at });
      return NextResponse.json({ ...(await syncSubscription(sub.subscription_id, { hintUid: user.uid })), renewsAt: at });
    }

    await dodo().subscriptions.update(sub.subscription_id, { cancel_at_next_billing_date: action === "cancel" });
    return NextResponse.json(await syncSubscription(sub.subscription_id, { hintUid: user.uid }));
  } catch (err) {
    console.error(`[IREWIN] Subscription ${action} failed:`, err);
    return NextResponse.json({ error: "Couldn't update your subscription. Please try again." }, { status: 502 });
  }
}

function summary(sub: { status: string; next_billing_date: string; previous_billing_date: string; cancel_at_next_billing_date: boolean }) {
  return {
    status: sub.status,
    previousBilling: sub.previous_billing_date,
    nextBilling: sub.next_billing_date,
    cancelAtNextBillingDate: sub.cancel_at_next_billing_date,
  };
}
