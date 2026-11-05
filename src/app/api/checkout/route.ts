import { NextResponse } from "next/server";
import { getPlan } from "@/lib/data/plans";
import { adminDb, requireUser } from "@/lib/server/firebase-admin";
import { dodo, productIdFor, subscriptionProductIdFor } from "@/lib/server/dodo";

const DAY = 86_400_000;

/**
 * POST { planId } with the user's Firebase ID token → creates a Dodo hosted
 * checkout for the plan's recurring (auto-renewing) product and returns its URL.
 * The uid and plan travel in the session's metadata, set here on the server,
 * so the webhooks know whom to upgrade.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  const productId = plan.recurring ? subscriptionProductIdFor(plan.id) : productIdFor(plan.id);
  if (!productId) {
    console.error(`[IREWIN] ${plan.recurring ? "DODO_SUBSCRIPTION" : "DODO_PRODUCT"}_${plan.id.toUpperCase()} is not set`);
    return NextResponse.json({ error: "Payments aren't set up for this plan yet." }, { status: 500 });
  }

  // One auto-renewing plan per member.
  // A one-off pass bought while Premium is active is added on after it (applyPayment).
  const membership = (await adminDb().collection("users").doc(user.uid).get()).get("membership") as
    | { status?: string; expiresAt?: { toMillis(): number }; subscriptionId?: string; autoRenew?: boolean }
    | null
    | undefined;
  const now = Date.now();
  const expiresAt = membership?.expiresAt?.toMillis() ?? 0;
  const active = membership?.status === "active" && expiresAt > now;
  if (active && membership?.subscriptionId && membership.autoRenew) {
    return NextResponse.json({ error: "You already have an auto-renewing Premium plan. Manage it from My account." }, { status: 409 });
  }
  if (!plan.recurring && active) {
    return NextResponse.json({ error: `You already have Premium, so a ${plan.name} pass isn't needed. Check My account for your plan.` }, { status: 409 });
  }
  // Paid time left that won't renew by itself (a one-off plan, or a subscription with auto-renew off):
  // the new plan's first charge waits until it ends, so nobody pays twice for the same days.
  const trialDays = plan.recurring && active && !membership?.autoRenew ? Math.min(Math.floor((expiresAt - now) / DAY), 365) : 0;

  const origin = process.env.SITE_URL ?? new URL(request.url).origin;
  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email ?? "", name: user.name ?? user.email ?? "IREWIN member" },
      metadata: { uid: user.uid, planId: plan.id },
      // IREWIN is for Ireland: always charge in euro and start the billing country at Ireland
      // (the customer can still change it). Without this, Dodo's adaptive pricing picks the
      // country and currency from the visitor's location — e.g. India/INR, where recurring card
      // payments need an RBI e-mandate and the subscription checkout fails.
      billing_currency: "EUR",
      billing_address: { country: "IE" },
      ...(trialDays > 0 ? { subscription_data: { trial_period_days: trialDays } } : {}),
      return_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/checkout?plan=${plan.id}`,
    });
    if (!session.checkout_url) throw new Error(`No checkout_url for session ${session.session_id}`);
    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (err) {
    console.error("[IREWIN] Dodo checkout session failed:", err);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again." }, { status: 502 });
  }
}
