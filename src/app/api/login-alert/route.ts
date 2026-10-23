import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, requireUser } from "@/lib/server/firebase-admin";
import { describeDevice, isEmailConfigured, sendLoginEmail } from "@/lib/server/email";

/** Only sign-ins from the last 10 minutes get an email, so an old session can't trigger one. */
const MAX_SIGN_IN_AGE_SECONDS = 10 * 60;

/**
 * POST (signed-in user) → emails the member that their account was just signed
 * in to. Called by the browser after a returning user signs in with Google
 * (first sign-ups get the welcome email instead). One email per sign-in:
 * Resend's idempotency key is uid + the token's auth_time.
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!isEmailConfigured()) {
    console.warn("[IREWIN] Sign-in email skipped: RESEND_API_KEY / EMAIL_FROM not set");
    return NextResponse.json({ status: "not_configured" });
  }

  const authTime = user.auth_time;
  if (Date.now() / 1000 - authTime > MAX_SIGN_IN_AGE_SECONDS) {
    return NextResponse.json({ status: "not_a_new_sign_in" });
  }

  const ref = adminDb().collection("users").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ status: "no_profile" });
  const to = (snap.get("email") as string) || user.email || "";
  if (!to) return NextResponse.json({ status: "no_email" });

  try {
    const siteUrl = process.env.SITE_URL ?? new URL(request.url).origin;
    const id = await sendLoginEmail({
      uid: user.uid,
      authTime,
      to,
      firstName: (snap.get("firstName") as string) ?? "",
      siteUrl,
      device: describeDevice(request.headers.get("user-agent")),
      timeZone: (snap.get("timeZone") as string) ?? null,
    });
    await ref.update({ lastLoginEmailAt: FieldValue.serverTimestamp(), lastLoginEmailId: id });
    return NextResponse.json({ status: "sent" });
  } catch (err) {
    console.error("[IREWIN] Sign-in email failed:", err);
    return NextResponse.json({ error: "Couldn't send the sign-in email." }, { status: 502 });
  }
}
