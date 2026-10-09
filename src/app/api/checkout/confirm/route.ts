import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/firebase-admin";
import { applyPayment, dodo } from "@/lib/server/dodo";

/**
 * POST { paymentId } from the return page. Fetches the payment from Dodo
 * (never trusts the ?status= in the URL) and applies it if it succeeded.
 * The webhook does the same thing; whichever arrives first wins, the other is
 * a no-op. This also makes local testing work without a public webhook URL.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { paymentId } = (await request.json().catch(() => ({}))) as { paymentId?: string };
  if (!paymentId) return NextResponse.json({ error: "Missing payment id." }, { status: 400 });

  try {
    const payment = await dodo().payments.retrieve(paymentId);
    if (payment.metadata?.uid !== user.uid) {
      return NextResponse.json({ error: "This payment belongs to a different account." }, { status: 403 });
    }
    return NextResponse.json(await applyPayment(payment));
  } catch (err) {
    console.error("[IREWIN] Confirming Dodo payment failed:", err);
    return NextResponse.json({ error: "Couldn't confirm the payment yet." }, { status: 502 });
  }
}
