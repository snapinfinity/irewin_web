import { NextResponse } from "next/server";
import { collection, getDocs, limit, query, where } from "firebase/firestore/lite";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * Health check: open /api/status to see whether the site can read the
 * dashboard's Firestore data. Shows no secrets — only which settings are
 * present and whether each public query works.
 */
export async function GET() {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    NEXT_PUBLIC_FIREBASE_APP_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };

  if (!isFirebaseConfigured) {
    return NextResponse.json({ ok: false, problem: "Firebase settings are missing in Vercel. Add the NEXT_PUBLIC_FIREBASE_* variables and redeploy.", env });
  }

  const checks: Record<string, { ok: boolean; found?: number; error?: string }> = {};
  const run = async (name: string, q: Parameters<typeof getDocs>[0]) => {
    try {
      const snap = await getDocs(q);
      checks[name] = { ok: true, found: snap.size };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      checks[name] = { ok: false, error: `${e.code ?? "error"}: ${e.message ?? String(err)}` };
    }
  };

  const db = getDb();
  await run("categories", query(collection(db, "categories"), where("isDeleted", "==", false), limit(50)));
  await run("jobs", query(collection(db, "jobs"), where("status", "==", "published"), where("isDeleted", "==", false), limit(50)));
  await run("companies", query(collection(db, "companies"), where("isDeleted", "==", false), limit(50)));

  return NextResponse.json({ ok: Object.values(checks).every((c) => c.ok), env, checks });
}
