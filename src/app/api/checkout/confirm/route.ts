import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/firebase-admin";
import { applyPayment, dodo, syncSubscription } from "@/lib/server/dodo";

/**
 * POST { subscriptionId?, paymentId? } from the return page. Fetches the
 * subscription (or payment) from Dodo — never trusts the ?status= in the URL —
 * and applies it. The webhooks do the same thing; whichever arrives first
 * wins, the rest are no-ops. This also makes local testing work without a
 * public webhook URL.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { paymentId?: string; subscriptionId?: string };
  let subscriptionId = body.subscriptionId ?? null;
  if (!subscriptionId && !body.paymentId) return NextResponse.json({ error: "Missing payment id." }, { status: 400 });

  try {
    if (!subscriptionId && body.paymentId) {
      const payment = await dodo().payments.retrieve(body.paymentId);
      if (payment.metadata?.uid !== user.uid) {
        return NextResponse.json({ error: "This payment belongs to a different account." }, { status: 403 });
      }
      if (!payment.subscription_id) return NextResponse.json(await applyPayment(payment)); // legacy one-off plan
      subscriptionId = payment.subscription_id;
    }

    const sub = await dodo().subscriptions.retrieve(subscriptionId!);
    const owner = typeof sub.metadata?.uid === "string" ? sub.metadata.uid : null;
    if (owner ? owner !== user.uid : sub.customer?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "This subscription belongs to a different account." }, { status: 403 });
    }
    if (sub.status === "pending") return NextResponse.json({ status: "not_paid", paymentStatus: "pending" });
    if (sub.status === "failed") return NextResponse.json({ status: "not_paid", paymentStatus: "failed" });

    const result = await syncSubscription(sub.subscription_id, { hintUid: user.uid });
    if (result.status === "ignored") return NextResponse.json(result);
    if (!result.active) return NextResponse.json({ status: "not_paid", paymentStatus: result.subscriptionStatus });
    return NextResponse.json({ status: "applied", expiresAt: result.expiresAt });
  } catch (err) {
    console.error("[IREWIN] Confirming Dodo checkout failed:", err);
    return NextResponse.json({ error: "Couldn't confirm the payment yet." }, { status: 502 });
  }
}
