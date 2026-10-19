import { NextResponse } from "next/server";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb, requireUser } from "@/lib/server/firebase-admin";
import { isEmailConfigured, sendWelcomeEmail } from "@/lib/server/email";

/**
 * POST (signed-in user) → sends the one-time welcome email. Called by the
 * browser right after a first sign-up creates users/{uid}. Each account gets
 * it once: `welcomeEmailSentAt` is claimed in a transaction before sending
 * and released again if Resend fails, so a later call can retry.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!isEmailConfigured()) {
    console.warn("[IREWIN] Welcome email skipped: RESEND_API_KEY / EMAIL_FROM not set");
    return NextResponse.json({ status: "not_configured" });
  }

  const ref = adminDb().collection("users").doc(user.uid);
  const claim = await adminDb().runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false as const, status: "no_profile" };
    if (snap.get("welcomeEmailSentAt")) return { ok: false as const, status: "already_sent" };
    tx.update(ref, { welcomeEmailSentAt: FieldValue.serverTimestamp() });
    return { ok: true as const, email: (snap.get("email") as string) || user.email || "", firstName: (snap.get("firstName") as string) ?? "" };
  });
  if (!claim.ok) return NextResponse.json({ status: claim.status });
  if (!claim.email) {
    await ref.update({ welcomeEmailSentAt: FieldValue.delete() });
    return NextResponse.json({ status: "no_email" });
  }

  try {
    const siteUrl = process.env.SITE_URL ?? new URL(request.url).origin;
    const id = await sendWelcomeEmail({ uid: user.uid, to: claim.email, firstName: claim.firstName, siteUrl });
    await ref.update({ welcomeEmailId: id });
    return NextResponse.json({ status: "sent" });
  } catch (err) {
    console.error("[IREWIN] Welcome email failed:", err);
    await ref.update({ welcomeEmailSentAt: FieldValue.delete() });
    return NextResponse.json({ error: "Couldn't send the welcome email." }, { status: 502 });
  }
}
