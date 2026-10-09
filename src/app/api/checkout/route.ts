import { NextResponse } from "next/server";
import { getPlan } from "@/lib/data/plans";
import { requireUser } from "@/lib/server/firebase-admin";
import { dodo, productIdFor } from "@/lib/server/dodo";

/**
 * POST { planId } with the user's Firebase ID token → creates a Dodo hosted
 * checkout and returns its URL. The uid and plan travel in the session's
 * metadata, set here on the server, so the webhook knows whom to upgrade.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  const productId = productIdFor(plan.id);
  if (!productId) {
    console.error(`[IREWIN] DODO_PRODUCT_${plan.id.toUpperCase()} is not set`);
    return NextResponse.json({ error: "Payments aren't set up for this plan yet." }, { status: 500 });
  }

  const origin = process.env.SITE_URL ?? new URL(request.url).origin;
  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email ?? "", name: user.name ?? user.email ?? "IREWIN member" },
      metadata: { uid: user.uid, planId: plan.id },
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
